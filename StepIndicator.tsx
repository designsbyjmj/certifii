import React from 'react';
import { Check } from 'lucide-react';
import { Step } from '../types';

interface StepIndicatorProps {
  currentStep: Step;
  completedSteps: Step[];
}

const steps = [
  { key: 'upload', label: 'Upload Template', description: 'Upload your certificate template', shortLabel: 'Upload' },
  { key: 'design', label: 'Design Fields', description: 'Position text fields on template', shortLabel: 'Design' },
  { key: 'data', label: 'Import Data', description: 'Upload Excel or CSV file', shortLabel: 'Data' },
  { key: 'generate', label: 'Generate', description: 'Create and download certificates', shortLabel: 'Generate' },
];

export default function StepIndicator({ currentStep, completedSteps }: StepIndicatorProps) {
  const getStepStatus = (stepKey: string) => {
    if (completedSteps.includes(stepKey as Step)) return 'completed';
    if (stepKey === currentStep) return 'current';
    return 'upcoming';
  };

  const getCurrentStepIndex = () => {
    return steps.findIndex(step => step.key === currentStep);
  };

  const getCurrentStepData = () => {
    return steps[getCurrentStepIndex()];
  };

  return (
    <div className="bg-white border-b border-gray-200 py-4 sm:py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mobile Step Indicator */}
        <div className="block sm:hidden mb-4">
          <div className="flex items-center justify-between text-sm font-medium text-gray-900 mb-3">
            <span>Step {getCurrentStepIndex() + 1} of {steps.length}</span>
            <span className="text-blue-600">{getCurrentStepData()?.shortLabel}</span>
          </div>
          
          {/* Segmented Progress Bar */}
          <div className="flex space-x-1 mb-4">
            {steps.map((step, index) => {
              const status = getStepStatus(step.key);
              return (
                <div
                  key={step.key}
                  className={`flex-1 h-2 rounded-full transition-all duration-300 ease-out ${
                    status === 'completed' ? 'bg-blue-600' : 
                    status === 'current' ? 'bg-blue-400' : 'bg-gray-200'
                  }`}
                />
              );
            })}
          </div>
          
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">
              {getCurrentStepData()?.label}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {getCurrentStepData()?.description}
            </div>
          </div>
        </div>

        {/* Desktop Step Indicator */}
        <nav aria-label="Progress" className="hidden sm:block">
          <ol className="flex items-center justify-center space-x-4 lg:space-x-8">
            {steps.map((step, index) => {
              const status = getStepStatus(step.key);
              return (
                <li key={step.key} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`
                        flex h-8 w-8 lg:h-10 lg:w-10 items-center justify-center rounded-full border-2 text-xs lg:text-sm font-semibold transition-all duration-200
                        ${status === 'completed' ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : ''}
                        ${status === 'current' ? 'border-blue-600 text-blue-600 bg-blue-50 shadow-md' : ''}
                        ${status === 'upcoming' ? 'border-gray-300 text-gray-500 bg-white' : ''}
                      `}
                    >
                      {status === 'completed' ? (
                        <Check className="h-3 w-3 lg:h-5 lg:w-5" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <div className="mt-2 text-center max-w-24 lg:max-w-none">
                      <p className={`text-xs lg:text-sm font-medium transition-colors duration-200 ${
                        status === 'current' ? 'text-blue-600' : 
                        status === 'completed' ? 'text-gray-700' : 'text-gray-500'
                      }`}>
                        <span className="hidden lg:inline">{step.label}</span>
                        <span className="lg:hidden">{step.shortLabel}</span>
                      </p>
                      <p className="text-xs text-gray-400 mt-1 hidden lg:block leading-tight">
                        {step.description}
                      </p>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 ml-2 lg:ml-4 mr-2 lg:mr-4 h-0.5 transition-colors duration-300 ${
                      completedSteps.includes(step.key as Step) ? 'bg-blue-600' : 'bg-gray-200'
                    }`} />
                  )}
                </li>
              );
            })}
          </ol>
        </nav>

        {/* Tablet Step Indicator (Simplified) */}
        <nav aria-label="Progress" className="hidden xs:block sm:hidden">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const status = getStepStatus(step.key);
              return (
                <div key={step.key} className="flex flex-col items-center flex-1">
                  <div
                    className={`
                      flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition-all duration-200
                      ${status === 'completed' ? 'bg-blue-600 border-blue-600 text-white' : ''}
                      ${status === 'current' ? 'border-blue-600 text-blue-600 bg-blue-50' : ''}
                      ${status === 'upcoming' ? 'border-gray-300 text-gray-500' : ''}
                    `}
                  >
                    {status === 'completed' ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <p className={`text-xs font-medium mt-1 text-center ${
                    status === 'current' ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {step.shortLabel}
                  </p>
                  {index < steps.length - 1 && (
                    <div className="absolute top-4 left-1/2 w-full h-0.5 bg-gray-200 -z-10" />
                  )}
                </div>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}