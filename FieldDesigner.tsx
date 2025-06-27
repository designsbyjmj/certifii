import React, { useState, useRef, useCallback } from 'react';
import { Plus, Settings, Trash2, Type, Move } from 'lucide-react';
import { TextField, Template } from '../types';

interface FieldDesignerProps {
  template: Template;
  fields: TextField[];
  onFieldsChange: (fields: TextField[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function FieldDesigner({ template, fields, onFieldsChange, onNext, onBack }: FieldDesignerProps) {
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Dummy text for preview based on common field names
  const getDummyText = (label: string): string => {
    const lowerLabel = label.toLowerCase();
    if (lowerLabel.includes('name')) return 'John Smith';
    if (lowerLabel.includes('course')) return 'Web Development';
    if (lowerLabel.includes('date')) return '2024-01-15';
    if (lowerLabel.includes('grade')) return 'A+';
    if (lowerLabel.includes('instructor')) return 'Dr. Johnson';
    if (lowerLabel.includes('institution')) return 'Tech Academy';
    if (lowerLabel.includes('score')) return '95%';
    if (lowerLabel.includes('duration')) return '6 months';
    if (lowerLabel.includes('certificate')) return 'Certificate of Completion';
    return 'Sample Text';
  };

  // Calculate text width using canvas measurement
  const calculateTextWidth = useCallback((text: string, fontSize: number, fontFamily: string): number => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    ctx.font = `${fontSize}px ${fontFamily}`;
    const metrics = ctx.measureText(text);
    return Math.ceil(metrics.width) + 20; // Add padding
  }, []);

  // Get effective width for a field
  const getEffectiveWidth = useCallback((field: TextField): number => {
    if (field.autoWidth) {
      const dummyText = getDummyText(field.label);
      return calculateTextWidth(dummyText, field.fontSize, field.fontFamily);
    }
    return field.width;
  }, [calculateTextWidth, getDummyText]);

  const addField = useCallback(() => {
    const newField: TextField = {
      id: `field-${Date.now()}`,
      label: `Field ${fields.length + 1}`,
      x: 100,
      y: 100,
      width: 2500,
      height: 300,
      fontSize: 200,
      fontFamily: 'Arial',
      color: '#000000',
      align: 'center',
      autoWidth: false,
    };
    onFieldsChange([...fields, newField]);
    setSelectedField(newField.id);
  }, [fields, onFieldsChange]);

  const updateField = useCallback((id: string, updates: Partial<TextField>) => {
    onFieldsChange(fields.map(field => {
      if (field.id === id) {
        const updatedField = { ...field, ...updates };
        
        // If autoWidth is being enabled, calculate the width
        if (updates.autoWidth === true) {
          const dummyText = getDummyText(updatedField.label);
          updatedField.width = calculateTextWidth(dummyText, updatedField.fontSize, updatedField.fontFamily);
        }
        
        // If font size, font family, or label changes and autoWidth is enabled, recalculate width
        if (updatedField.autoWidth && (updates.fontSize || updates.fontFamily || updates.label)) {
          const dummyText = getDummyText(updatedField.label);
          updatedField.width = calculateTextWidth(dummyText, updatedField.fontSize, updatedField.fontFamily);
        }
        
        return updatedField;
      }
      return field;
    }));
  }, [fields, onFieldsChange, calculateTextWidth, getDummyText]);

  const deleteField = useCallback((id: string) => {
    onFieldsChange(fields.filter(field => field.id !== id));
    setSelectedField(null);
  }, [fields, onFieldsChange]);

  const handleMouseDown = useCallback((e: React.MouseEvent, fieldId: string) => {
    e.preventDefault();
    setSelectedField(fieldId);
    setIsDragging(true);
    
    const field = fields.find(f => f.id === fieldId);
    if (field && containerRef.current && imageRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const imageRect = imageRef.current.getBoundingClientRect();
      
      // Calculate the scale between the displayed image and actual template dimensions
      const scaleX = template.width / imageRect.width;
      const scaleY = template.height / imageRect.height;
      
      // Get mouse position relative to the image
      const relativeX = (e.clientX - imageRect.left) * scaleX;
      const relativeY = (e.clientY - imageRect.top) * scaleY;
      
      setDragOffset({
        x: relativeX - field.x,
        y: relativeY - field.y,
      });
    }
  }, [fields, template.width, template.height]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !selectedField || !containerRef.current || !imageRef.current) return;
    
    const imageRect = imageRef.current.getBoundingClientRect();
    const scaleX = template.width / imageRect.width;
    const scaleY = template.height / imageRect.height;
    
    const relativeX = (e.clientX - imageRect.left) * scaleX;
    const relativeY = (e.clientY - imageRect.top) * scaleY;
    
    const x = Math.max(0, Math.min(template.width - 50, relativeX - dragOffset.x));
    const y = Math.max(0, Math.min(template.height - 20, relativeY - dragOffset.y));
    
    updateField(selectedField, { x, y });
  }, [isDragging, selectedField, dragOffset, updateField, template.width, template.height]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const selectedFieldData = selectedField ? fields.find(f => f.id === selectedField) : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Design Text Fields</h2>
        <p className="text-gray-600">Drag and drop text fields onto your certificate template</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Template Canvas */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Certificate Template</h3>
              <button
                onClick={addField}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Text Field
              </button>
            </div>
            
            <div className="border rounded-lg overflow-hidden bg-gray-50">
              <div
                ref={containerRef}
                className="relative inline-block mx-auto"
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                <img
                  ref={imageRef}
                  src={template.url}
                  alt="Certificate template"
                  className="max-w-full h-auto block"
                  style={{ maxHeight: '600px' }}
                  draggable={false}
                />
                
                {/* Text Fields */}
                {fields.map((field) => {
                  // Calculate the display scale
                  const imageElement = imageRef.current;
                  if (!imageElement) return null;
                  
                  const imageRect = imageElement.getBoundingClientRect();
                  const scaleX = imageRect.width / template.width;
                  const scaleY = imageRect.height / template.height;
                  
                  const effectiveWidth = getEffectiveWidth(field);
                  
                  return (
                    <div
                      key={field.id}
                      className={`absolute border-2 cursor-move flex items-center justify-center group ${
                        selectedField === field.id ? 'border-blue-500 shadow-lg bg-blue-100 bg-opacity-30' : 'border-blue-300 bg-blue-50 bg-opacity-20'
                      }`}
                      style={{
                        left: field.x * scaleX,
                        top: field.y * scaleY,
                        width: effectiveWidth * scaleX,
                        height: field.height * scaleY,
                      }}
                      onMouseDown={(e) => handleMouseDown(e, field.id)}
                    >
                      {/* Preview Text */}
                      <div
                        className="text-center w-full px-2 pointer-events-none"
                        style={{
                          fontSize: field.fontSize * scaleX,
                          fontFamily: field.fontFamily,
                          color: field.color,
                          textAlign: field.align,
                          lineHeight: '1.2',
                        }}
                      >
                        {getDummyText(field.label)}
                      </div>
                      
                      {/* Field Controls */}
                      <div className="absolute -top-6 left-0 bg-blue-600 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center space-x-1">
                        <Move className="h-3 w-3" />
                        <span>{field.label}</span>
                        {field.autoWidth && <span className="text-blue-200">(Auto)</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Template Info */}
            <div className="mt-4 text-sm text-gray-500 text-center">
              Template: {template.width} × {template.height}px
            </div>
          </div>
        </div>

        {/* Field Properties Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Field Properties
            </h3>
            
            {selectedFieldData ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Field Label
                  </label>
                  <input
                    type="text"
                    value={selectedFieldData.label}
                    onChange={(e) => updateField(selectedField!, { label: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter field name"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This name will be used to match data from your CSV/Excel file
                  </p>
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      value={selectedFieldData.autoWidth ? getEffectiveWidth(selectedFieldData) : selectedFieldData.width}
                      onChange={(e) => updateField(selectedField!, { width: parseInt(e.target.value), autoWidth: false })}
                      disabled={selectedFieldData.autoWidth}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        selectedFieldData.autoWidth ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                      }`}
                    />
                    {selectedFieldData.autoWidth && (
                      <p className="text-xs text-gray-500 mt-1">Auto-calculated: {getEffectiveWidth(selectedFieldData)}px</p>
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                
                <button
                  onClick={() => deleteField(selectedField!)}
                  className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors duration-200"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Field
                </button>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <Type className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Select a text field to edit its properties</p>
              </div>
            )}
          </div>
          
          {/* Fields List */}
          <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <h4 className="text-md font-medium text-gray-900 mb-4">Text Fields ({fields.length})</h4>
            <div className="space-y-2">
              {fields.map((field) => (
                <div
                  key={field.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors duration-200 ${
                    selectedField === field.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedField(field.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <div className="font-medium text-sm text-gray-900">{field.label}</div>
                        {field.autoWidth && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Auto
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {Math.round(field.x)}, {Math.round(field.y)} • {getEffectiveWidth(field)}×{field.height}
                      </div>
                      <div className="text-xs text-blue-600 mt-1">
                        Preview: "{getDummyText(field.label)}"
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <button
          onClick={onBack}
          className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors duration-200"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={fields.length === 0}
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
        >
          Continue to Data Import
        </button>
      </div>
    </div>
  );
}