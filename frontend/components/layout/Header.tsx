'use client';

import { Brain, Github } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-primary-600 rounded-lg">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Prompt Engineering Playground
              </h1>
              <p className="text-sm text-gray-500">
                Chain-of-Thought & A/B Testing Platform
              </p>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center space-x-4">
            <a
              href="https://github.com/your-repo/prompt-playground"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Github className="w-5 h-5" />
              <span className="text-sm">GitHub</span>
            </a>
            
            <button className="btn-outline">
              Export Data
            </button>
            
            <button className="btn-primary">
              New Template
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
