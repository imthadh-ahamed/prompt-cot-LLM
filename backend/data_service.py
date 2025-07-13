import pandas as pd
import sqlite3
import json
import uuid
import asyncio
from datetime import datetime
from typing import List, Dict, Any, Optional
from models import ExperimentLog, ExperimentResult, MetricsData, PromptTemplate
import logging

logger = logging.getLogger(__name__)

class DataService:
    def __init__(self, db_path: str = "prompt_playground.db"):
        self.db_path = db_path
        self._initialize_database()
    
    def _initialize_database(self):
        """Initialize SQLite database with required tables."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Experiments table
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS experiments (
                        id TEXT PRIMARY KEY,
                        prompt TEXT NOT NULL,
                        model_provider TEXT NOT NULL,
                        model_name TEXT NOT NULL,
                        model_config TEXT NOT NULL,
                        response TEXT NOT NULL,
                        metrics TEXT NOT NULL,
                        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                        user_rating INTEGER,
                        notes TEXT,
                        experiment_group TEXT
                    )
                """)
                
                # Templates table
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS templates (
                        id TEXT PRIMARY KEY,
                        name TEXT NOT NULL,
                        description TEXT,
                        template TEXT NOT NULL,
                        category TEXT NOT NULL,
                        variables TEXT,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                """)
                
                # A/B Tests table
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS ab_tests (
                        id TEXT PRIMARY KEY,
                        test_name TEXT NOT NULL,
                        variant_a_config TEXT NOT NULL,
                        variant_b_config TEXT NOT NULL,
                        traffic_split REAL DEFAULT 0.5,
                        success_metric TEXT NOT NULL,
                        status TEXT DEFAULT 'active',
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        ended_at DATETIME
                    )
                """)
                
                conn.commit()
                logger.info("Database initialized successfully")
                
        except Exception as e:
            logger.error(f"Error initializing database: {str(e)}")
            raise
    
    def save_experiment(self, experiment_result: ExperimentResult) -> str:
        """Save experiment result to database."""
        try:
            experiment_id = str(uuid.uuid4())
            
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO experiments (
                        id, prompt, model_provider, model_name, model_config,
                        response, metrics, timestamp, experiment_group
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    experiment_id,
                    experiment_result.prompt,
                    experiment_result.model_configuration.provider.value,
                    experiment_result.model_configuration.model_name,
                    json.dumps(experiment_result.model_configuration.dict()),
                    experiment_result.response,
                    json.dumps(experiment_result.metrics),
                    experiment_result.timestamp.isoformat(),
                    experiment_result.experiment_id
                ))
                conn.commit()
            
            logger.info(f"Experiment saved with ID: {experiment_id}")
            return experiment_id
            
        except Exception as e:
            logger.error(f"Error saving experiment: {str(e)}")
            raise
    
    def get_experiments(self, 
                            limit: int = 100, 
                            offset: int = 0,
                            model_provider: Optional[str] = None,
                            start_date: Optional[datetime] = None,
                            end_date: Optional[datetime] = None) -> List[Dict[str, Any]]:
        """Retrieve experiments with filtering options."""
        try:
            query = "SELECT * FROM experiments WHERE 1=1"
            params = []
            
            if model_provider:
                query += " AND model_provider = ?"
                params.append(model_provider)
            
            if start_date:
                query += " AND timestamp >= ?"
                params.append(start_date.isoformat())
            
            if end_date:
                query += " AND timestamp <= ?"
                params.append(end_date.isoformat())
            
            query += " ORDER BY timestamp DESC LIMIT ? OFFSET ?"
            params.extend([limit, offset])
            
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                cursor.execute(query, params)
                rows = cursor.fetchall()
            
            experiments = []
            for row in rows:
                experiment = dict(row)
                experiment['model_config'] = json.loads(experiment['model_config'])
                experiment['metrics'] = json.loads(experiment['metrics'])
                experiments.append(experiment)
            
            return experiments
            
        except Exception as e:
            logger.error(f"Error retrieving experiments: {str(e)}")
            raise
    
    async def get_experiments_dataframe(self, **filters) -> pd.DataFrame:
        """Get experiments as pandas DataFrame for analysis."""
        try:
            experiments = await asyncio.to_thread(self.get_experiments, **filters)
            if not experiments:
                return pd.DataFrame()
            
            # Flatten nested structures for DataFrame
            flattened_data = []
            for exp in experiments:
                flat_exp = {
                    'id': exp['id'],
                    'prompt': exp['prompt'],
                    'model_provider': exp['model_provider'],
                    'model_name': exp['model_name'],
                    'response': exp['response'],
                    'timestamp': exp['timestamp'],
                    'user_rating': exp['user_rating'],
                    'notes': exp['notes'],
                    'experiment_group': exp['experiment_group']
                }
                
                # Add model config fields
                model_config = exp['model_config']
                flat_exp.update({
                    f'config_{k}': v for k, v in model_config.items()
                })
                
                # Add metrics fields
                metrics = exp['metrics']
                flat_exp.update({
                    f'metric_{k}': v for k, v in metrics.items()
                })
                
                flattened_data.append(flat_exp)
            
            return pd.DataFrame(flattened_data)
            
        except Exception as e:
            logger.error(f"Error creating DataFrame: {str(e)}")
            raise
    
    def save_template(self, template: PromptTemplate) -> str:
        """Save prompt template to database."""
        try:
            template_id = template.id or str(uuid.uuid4())
            now = datetime.now()
            
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Check if template exists
                cursor.execute("SELECT id FROM templates WHERE id = ?", (template_id,))
                exists = cursor.fetchone()
                
                if exists:
                    # Update existing template
                    cursor.execute("""
                        UPDATE templates SET
                            name = ?, description = ?, template = ?, category = ?,
                            variables = ?, updated_at = ?
                        WHERE id = ?
                    """, (
                        template.name,
                        template.description,
                        template.template,
                        template.category,
                        json.dumps(template.variables),
                        now.isoformat(),
                        template_id
                    ))
                else:
                    # Insert new template
                    cursor.execute("""
                        INSERT INTO templates (
                            id, name, description, template, category, variables,
                            created_at, updated_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        template_id,
                        template.name,
                        template.description,
                        template.template,
                        template.category,
                        json.dumps(template.variables),
                        now.isoformat(),
                        now.isoformat()
                    ))
                
                conn.commit()
            
            logger.info(f"Template saved with ID: {template_id}")
            return template_id
            
        except Exception as e:
            logger.error(f"Error saving template: {str(e)}")
            raise
    
    def get_templates(self, category: Optional[str] = None) -> List[PromptTemplate]:
        """Retrieve prompt templates."""
        try:
            query = "SELECT * FROM templates"
            params = []
            
            if category:
                query += " WHERE category = ?"
                params.append(category)
            
            query += " ORDER BY created_at DESC"
            
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                cursor.execute(query, params)
                rows = cursor.fetchall()
            
            templates = []
            for row in rows:
                template_data = dict(row)
                template_data['variables'] = json.loads(template_data['variables'])
                template_data['created_at'] = datetime.fromisoformat(template_data['created_at'])
                template_data['updated_at'] = datetime.fromisoformat(template_data['updated_at'])
                templates.append(PromptTemplate(**template_data))
            
            return templates
            
        except Exception as e:
            logger.error(f"Error retrieving templates: {str(e)}")
            raise
    
    def delete_template(self, template_id: str) -> bool:
        """Delete a prompt template."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("DELETE FROM templates WHERE id = ?", (template_id,))
                conn.commit()
                return cursor.rowcount > 0
                
        except Exception as e:
            logger.error(f"Error deleting template: {str(e)}")
            raise
    
    def get_experiment_statistics(self) -> Dict[str, Any]:
        """Get experiment statistics for dashboard."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Total experiments
                cursor.execute("SELECT COUNT(*) FROM experiments")
                total_experiments = cursor.fetchone()[0]
                
                # Experiments by provider
                cursor.execute("""
                    SELECT model_provider, COUNT(*) as count 
                    FROM experiments 
                    GROUP BY model_provider
                """)
                provider_stats = dict(cursor.fetchall())
                
                # Average ratings
                cursor.execute("""
                    SELECT AVG(user_rating) 
                    FROM experiments 
                    WHERE user_rating IS NOT NULL
                """)
                avg_rating = cursor.fetchone()[0] or 0
                
                # Recent activity (last 7 days)
                cursor.execute("""
                    SELECT COUNT(*) 
                    FROM experiments 
                    WHERE datetime(timestamp) >= datetime('now', '-7 days')
                """)
                recent_activity = cursor.fetchone()[0]
                
                return {
                    "total_experiments": total_experiments,
                    "provider_stats": provider_stats,
                    "average_rating": round(avg_rating, 2),
                    "recent_activity": recent_activity
                }
                
        except Exception as e:
            logger.error(f"Error getting statistics: {str(e)}")
            raise
    
    def update_experiment_rating(self, experiment_id: str, rating: int, notes: Optional[str] = None) -> bool:
        """Update experiment rating and notes."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    UPDATE experiments 
                    SET user_rating = ?, notes = ? 
                    WHERE id = ?
                """, (rating, notes, experiment_id))
                conn.commit()
                return cursor.rowcount > 0
                
        except Exception as e:
            logger.error(f"Error updating experiment rating: {str(e)}")
            raise

    async def get_experiment_count(self) -> int:
        """Get total count of experiments for health checks."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT COUNT(*) FROM experiments")
                count = cursor.fetchone()[0]
                return count
                
        except Exception as e:
            logger.error(f"Error getting experiment count: {str(e)}")
            return 0
