"use client";

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useDropzone } from 'react-dropzone';

function getFileTypeFromExtension(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase();
  
  switch(extension) {
    case 'pdf':
      return 'application/pdf';
    case 'doc':
      return 'application/msword';
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'xls':
      return 'application/vnd.ms-excel';
    case 'xlsx':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case 'txt':
      return 'text/plain';
    case 'csv':
      return 'text/csv';
    default:
      return 'application/octet-stream';
  }
}

export default function FileUpload({ onUploadSuccess }: { onUploadSuccess: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [extractionProgress, setExtractionProgress] = useState(0);

  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/plain',
    'text/csv',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  const extractTextFromFile = async (file: File): Promise<string> => {
    try {
      const fileType = file.type || getFileTypeFromExtension(file.name);
      const arrayBuffer = await file.arrayBuffer();

      if (fileType === 'application/pdf') {
        // Dynamically import PDF.js
        const pdfjs = await import('pdfjs-dist');
        
        // Gunakan versi worker yang sesuai dengan package yang diinstall
        pdfjs.GlobalWorkerOptions.workerSrc = 
          `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

        const loadingTask = pdfjs.getDocument({
          data: new Uint8Array(arrayBuffer),
          disableFontFace: true,
          disableCreateObjectURL: true,
        });

        const pdf = await loadingTask.promise;
        
        let text = '';
        const maxPages = Math.min(pdf.numPages, 10);
        
        for (let i = 1; i <= maxPages; i++) {
          // Update progress
          setExtractionProgress(Math.round((i / maxPages) * 100));
          
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map((item: { str: string }) => item.str).join(' ') + '\n';
        }
        
        setExtractionProgress(100);
        return text;
      }
      // Handle Word documents
      else if (fileType.includes('word') || 
               fileType.includes('msword') || 
               fileType.includes('wordprocessingml')) {
        const mammoth = await import('mammoth');
        const result = await mammoth.extractRawText({ arrayBuffer });
        return result.value;
      }
      // Handle Excel files
      else if (fileType.includes('excel') || 
               fileType.includes('spreadsheetml')) {
        const { read, utils } = await import('xlsx');
        const workbook = read(arrayBuffer);
        let text = '';
        workbook.SheetNames.forEach(sheetName => {
          const worksheet = workbook.Sheets[sheetName];
          text += utils.sheet_to_csv(worksheet) + '\n\n';
        });
        return text;
      }
      // Handle text files
      else {
        return new TextDecoder().decode(arrayBuffer);
      }
    } catch (error) {
      console.error('Extraction failed:', error);
      throw new Error('Failed to extract text from file');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    // Validasi tipe file
    const fileType = file.type || getFileTypeFromExtension(file.name);
    if (!allowedTypes.includes(fileType)) {
      setError('File type not allowed');
      return;
    }

    setIsUploading(true);
    setError('');
    setProgress(0);
    setExtractionProgress(0);

    try {
      // 1. Ekstrak teks dari file di client side
      const fileContent = await extractTextFromFile(file);
      
      // 2. Buat FormData untuk upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('content', fileContent);

      // 3. Gunakan fetch API untuk upload dengan progress
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/files', true);

      // Track upload progress
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          setProgress(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          onUploadSuccess();
          setFile(null);
          setProgress(0);
          setExtractionProgress(0);
          // Reset file input
          const fileInput = document.getElementById('file-upload') as HTMLInputElement;
          if (fileInput) fileInput.value = '';
        } else {
          try {
            const response = JSON.parse(xhr.responseText);
            setError(response.error || 'Upload failed');
          } catch {
            setError('Upload failed');
          }
        }
        setIsUploading(false);
      };

      xhr.onerror = () => {
        setError('Network error. Please try again.');
        setIsUploading(false);
      };

      xhr.send(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file');
      console.error('Upload error:', err);
      setIsUploading(false);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) {
      setError('No files accepted');
      return;
    }

    const selectedFile = acceptedFiles[0];
    
    // Validasi tipe file
    const fileType = selectedFile.type || getFileTypeFromExtension(selectedFile.name);
    if (!fileType || !allowedTypes.includes(fileType)) {
      setError('File type not allowed. Please upload PDF, Excel, TXT, or Word files.');
      return;
    }

    // Validasi ukuran file
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size too large. Max 5MB allowed.');
      return;
    }

    setFile(selectedFile);
    setError('');
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/plain': ['.txt'],
      'text/csv': ['.csv']
    },
    maxSize: 5 * 1024 * 1024 // 5MB
  });

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Upload New File</h2>

      {/* Drag and Drop Zone */}
      <div
        {...getRootProps()}
        className={`p-6 border-2 rounded-md cursor-pointer transition-all ${
          isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
        }`}
      >
        <input {...getInputProps()} id="dropzone-input" />
        <p className="text-sm text-gray-500 text-center">
          {isDragActive
            ? 'Drop the file here...'
            : 'Drag & drop a file here, or click to select one'}
        </p>
      </div>

      {/* Manual Input as fallback */}
      <div className="flex items-center space-x-4">
        <input
          id="file-upload"
          type="file"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              onDrop(Array.from(e.target.files));
            }
          }}
          accept=".pdf,.xlsx,.xls,.txt,.csv,.doc,.docx"
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />

        <Button
          onClick={handleUpload}
          disabled={!file || isUploading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50"
        >
          {isUploading ? `Uploading... ${progress}%` : 'Upload'}
        </Button>
      </div>

      {/* Progress Bars */}
      {isUploading && (
        <>
          {/* Extraction Progress */}
          {extractionProgress > 0 && extractionProgress < 100 && (
            <div className="mt-2">
              <p className="text-xs text-gray-500 mb-1">Extracting text... {extractionProgress}%</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${extractionProgress}%` }}
                />
              </div>
            </div>
          )}
          
          {/* Upload Progress */}
          <div className="mt-2">
            <p className="text-xs text-gray-500 mb-1">Uploading file... {progress}%</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-2 text-sm text-red-500">
          <p>{error}</p>
          <p className="text-xs text-red-400">
            Supported formats: PDF, Word (DOC/DOCX), Excel (XLS/XLSX), TXT, CSV
          </p>
        </div>
      )}

      {/* File Info */}
      {file && (
        <div className="mt-2 text-sm text-gray-600">
          Selected file: {file.name} ({(file.size / 1024).toFixed(2)} KB)
          <br />
          Type: {file.type || getFileTypeFromExtension(file.name)}
        </div>
      )}
    </div>
  );
}