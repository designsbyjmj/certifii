import React, { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, Eye, AlertCircle, CheckCircle, Download, Wand2 } from 'lucide-react';
import Papa from 'papaparse';
import { CertificateData, TextField } from '../types';

interface DataImportProps {
  fields: TextField[];
  data: CertificateData[];
  onDataChange: (data: CertificateData[]) => void;
  onFieldsChange: (fields: TextField[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function DataImport({ 
  fields, 
  data, 
  onDataChange, 
  onFieldsChange,
  onNext, 
  onBack 
}: DataImportProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [detectedColumns, setDetectedColumns] = useState<string[]>([]);
  const [showColumnMapping, setShowColumnMapping] = useState(false);

  const fieldLabels = fields.map(field => field.label);

  const generateSampleCSV = useCallback(() => {
    const sampleData = [
      {
        'Name': 'John Smith',
        'Course': 'Web Development Bootcamp',
        'Date': '2024-01-15',
        'Grade': 'A+',
        'Instructor': 'Dr. Sarah Johnson',
        'Institution': 'Tech Academy'
      },
      {
        'Name': 'Emily Davis',
        'Course': 'Data Science Fundamentals',
        'Date': '2024-01-15',
        'Grade': 'A',
        'Instructor': 'Prof. Michael Chen',
        'Institution': 'Tech Academy'
      },
      {
        'Name': 'Michael Rodriguez',
        'Course': 'Digital Marketing',
        'Date': '2024-01-15',
        'Grade': 'B+',
        'Instructor': 'Ms. Lisa Wang',
        'Institution': 'Tech Academy'
      }
    ];

    const csv = Papa.unparse(sampleData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'certificate_data_sample.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const autoMapFields = useCallback(() => {
    if (detectedColumns.length === 0) return;

    const newFields: TextField[] = detectedColumns.map((column, index) => ({
      id: `field-${Date.now()}-${index}`,
      label: column,
      x: 100 + (index % 2) * 300,
      y: 150 + Math.floor(index / 2) * 80,
      width: 250,
      height: 40,
      fontSize: 18,
      fontFamily: 'Arial',
      color: '#000000',
      align: 'center',
    }));

    onFieldsChange(newFields);
    setShowColumnMapping(false);
  }, [detectedColumns, onFieldsChange]);

  const processFile = useCallback((file: File) => {
    setIsProcessing(true);
    setErrors([]);
    setDetectedColumns([]);

    Papa.parse(file, {
      header: true,
      complete: (results) => {
        setIsProcessing(false);
        
        if (results.errors.length > 0) {
          setErrors(results.errors.map(error => error.message));
          return;
        }

        const csvData = results.data as CertificateData[];
        const validData = csvData.filter(row => 
          Object.values(row).some(value => value && value.toString().trim() !== '')
        );

        if (validData.length === 0) {
          setErrors(['No valid data found in the file']);
          return;
        }

        // Detect columns from the CSV
        const columns = Object.keys(validData[0] || {}).filter(key => key.trim() !== '');
        setDetectedColumns(columns);

        // Check if we have fields defined
        if (fields.length === 0) {
          setShowColumnMapping(true);
        } else {
          // Check if required fields are present
          const missingFields = fieldLabels.filter(field => !columns.includes(field));
          
          if (missingFields.length > 0) {
            setErrors([`Missing required columns: ${missingFields.join(', ')}`]);
            setShowColumnMapping(true);
            return;
          }
        }

        onDataChange(validData);
      },
      error: (error) => {
        setIsProcessing(false);
        setErrors([error.message]);
      }
    });
  }, [fieldLabels, fields.length, onDataChange]);

  const handleFileUpload = useCallback((file: File) => {
    if (!file.name.match(/\.(csv|xlsx?)$/i)) {
      setErrors(['Please upload a CSV or Excel file']);
      return;
    }
    processFile(file);
  }, [processFile]);

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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Import Data</h2>
        <p className="text-gray-600">Upload your CSV or Excel file with certificate data</p>
      </div>

      {/* Sample Template Download */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-blue-900 mb-2">Need a template?</h3>
            <p className="text-sm text-blue-700">
              Download our sample CSV file to see the expected format and get started quickly.
            </p>
          </div>
          <button
            onClick={generateSampleCSV}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Sample
          </button>
        </div>
      </div>

      {/* Column Mapping Modal */}
      {showColumnMapping && detectedColumns.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Detected Columns</h3>
            <button
              onClick={() => setShowColumnMapping(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
          
          <p className="text-sm text-gray-600 mb-4">
            We found {detectedColumns.length} columns in your file. You can automatically create text fields for all columns or continue with your existing field setup.
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-6">
            {detectedColumns.map((column, index) => (
              <div
                key={index}
                className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center"
              >
                <span className="text-sm font-medium text-gray-900">{column}</span>
              </div>
            ))}
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={autoMapFields}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              <Wand2 className="h-4 w-4 mr-2" />
              Auto-Create Fields
            </button>
            <button
              onClick={() => setShowColumnMapping(false)}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              Use Existing Fields
            </button>
          </div>
        </div>
      )}

      {/* Required Fields Info */}
      {fields.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-blue-900 mb-2">Required Columns in Your File:</h3>
          <div className="flex flex-wrap gap-2">
            {fieldLabels.map((label, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* File Upload */}
      {data.length === 0 ? (
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-400 transition-colors duration-200"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <div className="text-lg font-medium text-gray-900 mb-2">
            Drop your data file here
          </div>
          <div className="text-gray-600 mb-4">
            or click to browse files
          </div>
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            className="hidden"
            id="data-upload"
            disabled={isProcessing}
          />
          <label
            htmlFor="data-upload"
            className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white cursor-pointer transition-colors duration-200 ${
              isProcessing 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                <Upload className="h-5 w-5 mr-2" />
                Choose File
              </>
            )}
          </label>
          <div className="mt-4 text-sm text-gray-500">
            Supported formats: CSV, Excel (.xlsx, .xls)
          </div>
        </div>
      ) : (
        /* Data Preview */
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <h3 className="text-lg font-medium text-gray-900">
                  Data Imported Successfully
                </h3>
              </div>
              <button
                onClick={() => {
                  onDataChange([]);
                  setDetectedColumns([]);
                  setShowColumnMapping(false);
                }}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Upload Different File
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">{data.length}</div>
                <div className="text-sm text-gray-600">Total Records</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">{detectedColumns.length}</div>
                <div className="text-sm text-gray-600">Detected Columns</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{data.length}</div>
                <div className="text-sm text-gray-600">Certificates to Generate</div>
              </div>
            </div>

            {detectedColumns.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Available Columns:</h4>
                <div className="flex flex-wrap gap-2">
                  {detectedColumns.map((column, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                    >
                      {column}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center text-blue-600 hover:text-blue-700 font-medium"
            >
              <Eye className="h-4 w-4 mr-2" />
              {showPreview ? 'Hide' : 'Show'} Data Preview
            </button>

            {showPreview && (
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {detectedColumns.map((header, index) => (
                        <th
                          key={index}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.slice(0, 5).map((row, index) => (
                      <tr key={index}>
                        {detectedColumns.map((header, cellIndex) => (
                          <td
                            key={cellIndex}
                            className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                          >
                            {row[header] || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {data.length > 5 && (
                  <div className="text-center py-2 text-sm text-gray-500">
                    ... and {data.length - 5} more records
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-6">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-red-800">
                Error processing file:
              </h3>
              <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

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
          disabled={data.length === 0}
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
        >
          Generate Certificates
        </button>
      </div>
    </div>
  );
}