import React, { useState, useRef, useCallback } from 'react';
import { Download, Eye, FileText, Package, CheckCircle, Settings, Move, RotateCcw } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Template, TextField, CertificateData } from '../types';

interface CertificateGeneratorProps {
  template: Template;
  fields: TextField[];
  data: CertificateData[];
  onBack: () => void;
  onReset: () => void;
}

export default function CertificateGenerator({ 
  template, 
  fields, 
  data, 
  onBack, 
  onReset 
}: CertificateGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [generatedCount, setGeneratedCount] = useState(0);
  const [editableFields, setEditableFields] = useState<TextField[]>(fields);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isEditMode, setIsEditMode] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [displayScale, setDisplayScale] = useState(1);

  // Calculate text width using canvas measurement
  const calculateTextWidth = useCallback((text: string, fontSize: number, fontFamily: string): number => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    ctx.font = `${fontSize}px ${fontFamily}`;
    const metrics = ctx.measureText(text);
    return Math.ceil(metrics.width) + 20; // Add padding
  }, []);

  // Get effective width for a field with actual data
  const getEffectiveWidth = useCallback((field: TextField, certificateData?: CertificateData): number => {
    if (field.autoWidth && certificateData) {
      const text = certificateData[field.label] || '';
      if (text) {
        return calculateTextWidth(text, field.fontSize, field.fontFamily);
      }
    }
    return field.width;
  }, [calculateTextWidth]);

  const updateField = useCallback((id: string, updates: Partial<TextField>) => {
    setEditableFields(prev => prev.map(field => {
      if (field.id === id) {
        const updatedField = { ...field, ...updates };
        
        // If autoWidth is being enabled, calculate the width based on current preview data
        if (updates.autoWidth === true && data[previewIndex]) {
          const text = data[previewIndex][updatedField.label] || '';
          if (text) {
            updatedField.width = calculateTextWidth(text, updatedField.fontSize, updatedField.fontFamily);
          }
        }
        
        // If font size, font family, or label changes and autoWidth is enabled, recalculate width
        if (updatedField.autoWidth && (updates.fontSize || updates.fontFamily || updates.label) && data[previewIndex]) {
          const text = data[previewIndex][updatedField.label] || '';
          if (text) {
            updatedField.width = calculateTextWidth(text, updatedField.fontSize, updatedField.fontFamily);
          }
        }
        
        return updatedField;
      }
      return field;
    }));
  }, [calculateTextWidth, data, previewIndex]);

  const resetFields = useCallback(() => {
    setEditableFields(fields);
    setSelectedField(null);
  }, [fields]);

  const handleMouseDown = useCallback((e: React.MouseEvent, fieldId: string) => {
    if (!isEditMode) return;
    e.preventDefault();
    e.stopPropagation();
    
    setSelectedField(fieldId);
    setIsDragging(true);
    
    const field = editableFields.find(f => f.id === fieldId);
    if (field && containerRef.current) {
      const canvas = canvasRef.current;
      if (canvas) {
        const canvasRect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / canvasRect.width;
        const scaleY = canvas.height / canvasRect.height;
        
        const relativeX = (e.clientX - canvasRect.left) * scaleX;
        const relativeY = (e.clientY - canvasRect.top) * scaleY;
        
        setDragOffset({
          x: relativeX - field.x,
          y: relativeY - field.y,
        });
      }
    }
  }, [isEditMode, editableFields]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !selectedField || !containerRef.current) return;
    
    const canvas = canvasRef.current;
    if (canvas) {
      const canvasRect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / canvasRect.width;
      const scaleY = canvas.height / canvasRect.height;
      
      const relativeX = (e.clientX - canvasRect.left) * scaleX;
      const relativeY = (e.clientY - canvasRect.top) * scaleY;
      
      const x = Math.max(0, Math.min(template.width - 50, relativeX - dragOffset.x));
      const y = Math.max(0, Math.min(template.height - 20, relativeY - dragOffset.y));
      
      updateField(selectedField, { x, y });
    }
  }, [isDragging, selectedField, dragOffset, updateField, template.width, template.height]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const generateCertificateImage = useCallback(async (certificateData: CertificateData): Promise<Blob> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      canvas.width = template.width;
      canvas.height = template.height;

      const img = new window.Image();
      img.onload = () => {
        // Draw template
        ctx.drawImage(img, 0, 0, template.width, template.height);

        // Draw text fields using the edited positions and auto-width calculations
        editableFields.forEach(field => {
          ctx.font = `${field.fontSize}px ${field.fontFamily}`;
          ctx.fillStyle = field.color;
          ctx.textAlign = field.align;
          
          const text = certificateData[field.label] || '';
          const effectiveWidth = getEffectiveWidth(field, certificateData);
          
          let x = field.x;
          if (field.align === 'center') {
            x = field.x + effectiveWidth / 2;
          } else if (field.align === 'right') {
            x = field.x + effectiveWidth;
          }
          
          const y = field.y + field.height / 2 + field.fontSize / 3;
          
          ctx.fillText(text, x, y);
        });

        canvas.toBlob((blob) => {
          resolve(blob!);
        }, 'image/png');
      };
      img.src = template.url;
    });
  }, [template, editableFields, getEffectiveWidth]);

  const generateAllCertificates = useCallback(async () => {
    setIsGenerating(true);
    setGeneratedCount(0);

    const zip = new JSZip();
    
    for (let i = 0; i < data.length; i++) {
      const certificateData = data[i];
      const blob = await generateCertificateImage(certificateData);
      
      const fileName = certificateData[editableFields[0]?.label] || `certificate-${i + 1}`;
      const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9-_]/g, '_');
      
      zip.file(`${sanitizedFileName}.png`, blob);
      setGeneratedCount(i + 1);
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, 'certificates.zip');
    
    setIsGenerating(false);
  }, [data, generateCertificateImage, editableFields]);

  const renderPreview = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d')!;
    const certificateData = data[previewIndex];

    // Set canvas to actual template dimensions
    canvas.width = template.width;
    canvas.height = template.height;

    const img = new window.Image();
    img.onload = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw template at actual size
      ctx.drawImage(img, 0, 0, template.width, template.height);

      // Draw text fields using their exact coordinates and auto-width calculations
      editableFields.forEach(field => {
        ctx.font = `${field.fontSize}px ${field.fontFamily}`;
        ctx.fillStyle = field.color;
        ctx.textAlign = field.align;
        
        const text = certificateData[field.label] || '';
        const effectiveWidth = getEffectiveWidth(field, certificateData);
        
        // Use the exact same positioning logic as the field designer
        let x = field.x;
        if (field.align === 'center') {
          x = field.x + effectiveWidth / 2;
        } else if (field.align === 'right') {
          x = field.x + effectiveWidth;
        }
        
        // Center text vertically in the field
        const y = field.y + field.height / 2 + field.fontSize / 3;
        
        ctx.fillText(text, x, y);
      });

      // Calculate display scale after rendering
      setTimeout(() => {
        const canvasRect = canvas.getBoundingClientRect();
        const scale = canvasRect.width / canvas.width;
        setDisplayScale(scale);
      }, 0);
    };
    img.src = template.url;
  }, [template, editableFields, data, previewIndex, getEffectiveWidth]);

  const renderEditOverlay = useCallback(() => {
    if (!isEditMode) return null;

    const canvas = canvasRef.current;
    if (!canvas) return null;

    const canvasRect = canvas.getBoundingClientRect();
    const scaleX = canvasRect.width / canvas.width;
    const scaleY = canvasRect.height / canvas.height;

    return (
      <div className="absolute inset-0 pointer-events-none">
        {editableFields.map((field) => {
          const effectiveWidth = getEffectiveWidth(field, data[previewIndex]);
          
          return (
            <div
              key={field.id}
              className={`absolute border-2 cursor-move pointer-events-auto group ${
                selectedField === field.id 
                  ? 'border-blue-500 bg-blue-100 bg-opacity-30' 
                  : 'border-blue-300 bg-blue-50 bg-opacity-20'
              }`}
              style={{
                left: field.x * scaleX,
                top: field.y * scaleY,
                width: effectiveWidth * scaleX,
                height: field.height * scaleY,
              }}
              onMouseDown={(e) => handleMouseDown(e, field.id)}
            >
              <div className="absolute -top-6 left-0 bg-blue-600 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center space-x-1">
                <Move className="h-3 w-3" />
                <span>{field.label}</span>
                {field.autoWidth && <span className="text-blue-200">(Auto)</span>}
              </div>
            </div>
          );
        })}
      </div>
    );
  }, [isEditMode, editableFields, selectedField, handleMouseDown, getEffectiveWidth, data, previewIndex]);

  React.useEffect(() => {
    if (data.length > 0) {
      renderPreview();
    }
  }, [renderPreview, data.length]);

  const selectedFieldData = selectedField ? editableFields.find(f => f.id === selectedField) : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Generate Certificates</h2>
        <p className="text-sm sm:text-base text-gray-600">Preview and fine-tune your certificates before generating</p>
      </div>

      <div className="space-y-6 lg:space-y-8">
        {/* Preview Section - Now at the top */}
        <div className="bg-white rounded-lg shadow-md p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 space-y-2 sm:space-y-0">
            <h3 className="text-base sm:text-lg font-medium text-gray-900">Certificate Preview</h3>
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsEditMode(!isEditMode)}
                  className={`inline-flex items-center px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors duration-200 ${
                    isEditMode 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Settings className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  <span className="hidden sm:inline">{isEditMode ? 'Exit Edit' : 'Edit Fields'}</span>
                  <span className="sm:hidden">{isEditMode ? 'Exit' : 'Edit'}</span>
                </button>
                {isEditMode && (
                  <button
                    onClick={resetFields}
                    className="inline-flex items-center px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                  >
                    <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    <span className="hidden sm:inline">Reset</span>
                  </button>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <select
                  value={previewIndex}
                  onChange={(e) => setPreviewIndex(parseInt(e.target.value))}
                  className="px-2 sm:px-3 py-1 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-32 sm:max-w-none"
                >
                  {data.map((item, index) => (
                    <option key={index} value={index}>
                      {item[editableFields[0]?.label] || `Certificate ${index + 1}`}
                    </option>
                  ))}
                </select>
                <span className="text-xs sm:text-sm text-gray-500 whitespace-nowrap">
                  {previewIndex + 1} of {data.length}
                </span>
              </div>
            </div>
          </div>
          
          {isEditMode && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs sm:text-sm text-blue-800">
                <strong>Edit Mode:</strong> Click and drag text fields to reposition them. Select a field to edit its properties in the panel below. Auto-width fields will adjust to fit the current preview data.
              </p>
            </div>
          )}
          
          <div 
            ref={containerRef}
            className="border rounded-lg overflow-hidden bg-gray-50 p-2 sm:p-4 relative"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <div className="relative inline-block mx-auto w-full">
              <canvas
                ref={canvasRef}
                className="max-w-full h-auto border border-gray-200 rounded shadow-sm block mx-auto"
                style={{ 
                  maxHeight: '400px',
                  cursor: isEditMode ? 'crosshair' : 'default'
                }}
              />
              {renderEditOverlay()}
            </div>
          </div>

          {/* Template Info */}
          <div className="mt-4 flex flex-col sm:flex-row sm:justify-between sm:items-center text-xs sm:text-sm text-gray-500 space-y-1 sm:space-y-0">
            <span>Template: {template.width} × {template.height}px</span>
            <span>Display Scale: {Math.round(displayScale * 100)}%</span>
          </div>

          {/* Certificate Data */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
            {editableFields.map((field, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-1">
                  <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    {field.label}
                  </div>
                  {field.autoWidth && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Auto
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-900 break-words">
                  {data[previewIndex][field.label] || '-'}
                </div>
                {field.autoWidth && data[previewIndex][field.label] && (
                  <div className="text-xs text-blue-600 mt-1">
                    Width: {getEffectiveWidth(field, data[previewIndex])}px
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Control Panels Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8">
          {/* Field Properties (when in edit mode) */}
          {isEditMode && selectedFieldData && (
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Settings className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Field Properties
              </h3>
              
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Field Label
                  </label>
                  <input
                    type="text"
                    value={selectedFieldData.label}
                    onChange={(e) => updateField(selectedField!, { label: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      X Position
                    </label>
                    <input
                      type="number"
                      value={Math.round(selectedFieldData.x)}
                      onChange={(e) => updateField(selectedField!, { x: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Y Position
                    </label>
                    <input
                      type="number"
                      value={Math.round(selectedFieldData.y)}
                      onChange={(e) => updateField(selectedField!, { y: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                {/* Auto Width Toggle */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-blue-900">
                      Auto Width
                    </label>
                    <button
                      onClick={() => updateField(selectedField!, { autoWidth: !selectedFieldData.autoWidth })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                        selectedFieldData.autoWidth ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                          selectedFieldData.autoWidth ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  <p className="text-xs text-blue-700">
                    {selectedFieldData.autoWidth 
                      ? 'Width automatically adjusts to fit text content'
                      : 'Set width manually using the input below'
                    }
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Width
                    </label>
                    <input
                      type="number"
                      value={selectedFieldData.autoWidth ? getEffectiveWidth(selectedFieldData, data[previewIndex]) : selectedFieldData.width}
                      onChange={(e) => updateField(selectedField!, { width: parseInt(e.target.value), autoWidth: false })}
                      disabled={selectedFieldData.autoWidth}
                      className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        selectedFieldData.autoWidth ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                      }`}
                    />
                    {selectedFieldData.autoWidth && (
                      <p className="text-xs text-gray-500 mt-1">Auto-calculated: {getEffectiveWidth(selectedFieldData, data[previewIndex])}px</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Height
                    </label>
                    <input
                      type="number"
                      value={selectedFieldData.height}
                      onChange={(e) => updateField(selectedField!, { height: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Font Size
                  </label>
                  <input
                    type="number"
                    value={selectedFieldData.fontSize}
                    onChange={(e) => updateField(selectedField!, { fontSize: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {selectedFieldData.autoWidth && (
                    <p className="text-xs text-blue-600 mt-1">Width will auto-adjust when font size changes</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Font Family
                  </label>
                  <select
                    value={selectedFieldData.fontFamily}
                    onChange={(e) => updateField(selectedField!, { fontFamily: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Arial">Arial</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Helvetica">Helvetica</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Verdana">Verdana</option>
                    <option value="Courier New">Courier New</option>
                  </select>
                  {selectedFieldData.autoWidth && (
                    <p className="text-xs text-blue-600 mt-1">Width will auto-adjust when font changes</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Text Alignment
                  </label>
                  <select
                    value={selectedFieldData.align}
                    onChange={(e) => updateField(selectedField!, { align: e.target.value as 'left' | 'center' | 'right' })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Text Color
                  </label>
                  <input
                    type="color"
                    value={selectedFieldData.color}
                    onChange={(e) => updateField(selectedField!, { color: e.target.value })}
                    className="w-full h-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Generation Panel */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Package className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Generation Summary
            </h3>
            
            <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm text-gray-600">Total Certificates</span>
                <span className="font-medium">{data.length}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm text-gray-600">Text Fields</span>
                <span className="font-medium">{editableFields.length}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm text-gray-600">Auto-Width Fields</span>
                <span className="font-medium">{editableFields.filter(f => f.autoWidth).length}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm text-gray-600">Output Format</span>
                <span className="font-medium">PNG</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600">Delivery</span>
                <span className="font-medium">ZIP Archive</span>
              </div>
            </div>

            {isGenerating ? (
              <div className="text-center py-4 sm:py-6">
                <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <div className="text-sm font-medium text-gray-900 mb-2">
                  Generating Certificates...
                </div>
                <div className="text-xs text-gray-600">
                  Progress: {generatedCount} of {data.length}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(generatedCount / data.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            ) : (
              <button
                onClick={generateAllCertificates}
                disabled={isEditMode}
                className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 text-sm sm:text-base"
              >
                <Download className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Generate & Download All
              </button>
            )}

            {isEditMode && (
              <p className="text-xs text-gray-500 mt-2 text-center">
                Exit edit mode to generate certificates
              </p>
            )}

            <div className="mt-4 space-y-2">
              <button
                onClick={onBack}
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors duration-200 text-sm sm:text-base"
              >
                <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                Back to Data
              </button>
              <button
                onClick={onReset}
                className="w-full flex items-center justify-center px-4 py-2 text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors duration-200 text-sm sm:text-base"
              >
                <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                Start New Project
              </button>
            </div>
          </div>

          {/* Tips - Only show when not in edit mode or when field properties panel is not visible */}
          {(!isEditMode || !selectedFieldData) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 lg:col-span-2">
              <h4 className="font-medium text-blue-900 mb-2 flex items-center text-sm sm:text-base">
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                Auto-Width Tips
              </h4>
              <ul className="text-xs sm:text-sm text-blue-800 space-y-1">
                <li>• Enable auto-width for dynamic text sizing</li>
                <li>• Width adjusts based on actual certificate data</li>
                <li>• Font size and family changes update width automatically</li>
                <li>• Manual width control available when auto-width is off</li>
                <li>• Perfect for names and variable-length content</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}