import React, { useCallback } from 'react';
import { Upload, Image as ImageIcon, FileText } from 'lucide-react';
import { Template } from '../types';

interface TemplateUploadProps {
  template: Template | null;
  onTemplateUpload: (template: Template) => void;
  onNext: () => void;
}

export default function TemplateUpload({ template, onTemplateUpload, onNext }: TemplateUploadProps) {
  const handleFileUpload = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      onTemplateUpload({
        file,
        url,
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };
    img.src = url;
  }, [onTemplateUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Certificate Template</h2>
        <p className="text-gray-600">Upload your certificate base image to get started</p>
      </div>

      {!template ? (
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-400 transition-colors duration-200"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <div className="text-lg font-medium text-gray-900 mb-2">
            Drop your certificate template here
          </div>
          <div className="text-gray-600 mb-4">
            or click to browse files
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            className="hidden"
            id="template-upload"
          />
          <label
            htmlFor="template-upload"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer transition-colors duration-200"
          >
            <ImageIcon className="h-5 w-5 mr-2" />
            Choose image
          </label>
          <div className="mt-4 text-sm text-gray-500">
            Supported formats: JPG, PNG, GIF (max 10MB)
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Template Preview</h3>
              <button
                onClick={() => onTemplateUpload(null as any)}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Change Template
              </button>
            </div>
            <div className="border rounded-lg p-4 bg-gray-50">
              <img
                src={template.url}
                alt="Certificate template"
                className="max-w-full h-auto mx-auto rounded shadow-sm"
                style={{ maxHeight: '400px' }}
              />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-gray-600">
              <div className="flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                <span>Dimensions: {template.width} × {template.height}px</span>
              </div>
              <div className="flex items-center">
                <ImageIcon className="h-4 w-4 mr-2" />
                <span>Format: {template.file.type}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={onNext}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              Continue to Design
            </button>
          </div>
        </div>
      )}
    </div>
  );
}