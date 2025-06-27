import React, { useState } from 'react';
import Header from './components/Header';
import StepIndicator from './components/StepIndicator';
import TemplateUpload from './components/TemplateUpload';
import FieldDesigner from './components/FieldDesigner';
import DataImport from './components/DataImport';
import CertificateGenerator from './components/CertificateGenerator';
import { Step, Template, TextField, CertificateData } from './types';

function App() {
  const [currentStep, setCurrentStep] = useState<Step>('upload');
  const [completedSteps, setCompletedSteps] = useState<Step[]>([]);
  const [template, setTemplate] = useState<Template | null>(null);
  const [fields, setFields] = useState<TextField[]>([]);
  const [data, setData] = useState<CertificateData[]>([]);

  const markStepCompleted = (step: Step) => {
    if (!completedSteps.includes(step)) {
      setCompletedSteps([...completedSteps, step]);
    }
  };

  const handleTemplateUpload = (newTemplate: Template) => {
    setTemplate(newTemplate);
  };

  const handleNextFromUpload = () => {
    markStepCompleted('upload');
    setCurrentStep('design');
  };

  const handleNextFromDesign = () => {
    markStepCompleted('design');
    setCurrentStep('data');
  };

  const handleNextFromData = () => {
    markStepCompleted('data');
    setCurrentStep('generate');
  };

  const handleBackToUpload = () => {
    setCurrentStep('upload');
  };

  const handleBackToDesign = () => {
    setCurrentStep('design');
  };

  const handleBackToData = () => {
    setCurrentStep('data');
  };

  const handleReset = () => {
    setCurrentStep('upload');
    setCompletedSteps([]);
    setTemplate(null);
    setFields([]);
    setData([]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <StepIndicator currentStep={currentStep} completedSteps={completedSteps} />
      
      {currentStep === 'upload' && (
        <TemplateUpload
          template={template}
          onTemplateUpload={handleTemplateUpload}
          onNext={handleNextFromUpload}
        />
      )}
      
      {currentStep === 'design' && template && (
        <FieldDesigner
          template={template}
          fields={fields}
          onFieldsChange={setFields}
          onNext={handleNextFromDesign}
          onBack={handleBackToUpload}
        />
      )}
      
      {currentStep === 'data' && (
        <DataImport
          fields={fields}
          data={data}
          onDataChange={setData}
          onFieldsChange={setFields}
          onNext={handleNextFromData}
          onBack={handleBackToDesign}
        />
      )}
      
      {currentStep === 'generate' && template && (
        <CertificateGenerator
          template={template}
          fields={fields}
          data={data}
          onBack={handleBackToData}
          onReset={handleReset}
        />
      )}
    </div>
  );
}

export default App;