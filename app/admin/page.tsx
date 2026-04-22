"use client";

import { useState, useEffect } from 'react';
import FileUpload from '@/components/admin/FileUpload';
import FileList from '@/components/admin/FileList';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SearchIcon, Trash2Icon, Loader2Icon, LogOutIcon } from 'lucide-react';

export default function AdminDashboard() {
  const [files, setFiles] = useState<any[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchFiles();
  }, []);

  useEffect(() => {
    // Filter lokal saat searchQuery berubah
    if (searchQuery.trim() === '') {
      setFilteredFiles(files);
    } else {
      setFilteredFiles(
        files.filter(file => 
          file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          file.content?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
  }, [searchQuery, files]);

  const fetchFiles = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/files');
      if (!res.ok) throw new Error('Failed to fetch files');
      const data = await res.json();
      setFiles(data.files || []);
      setFilteredFiles(data.files || []);
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSemanticSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      setIsSearching(true);
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: searchQuery })
      });
      
      if (!res.ok) throw new Error('Search failed');
      const results = await res.json();
      setFilteredFiles(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleDelete = async (fileId: string) => {
    try {
      setIsDeleting(fileId);
      const res = await fetch(`/api/files/${fileId}`, { 
        method: 'DELETE' 
      });
      
      if (!res.ok) throw new Error('Delete failed');
      setFiles(prev => prev.filter(file => file.id !== fileId));
      setFilteredFiles(prev => prev.filter(file => file.id !== fileId));
    } catch (error) {
      console.error('Error deleting file:', error);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleResetSearch = () => {
    setSearchQuery('');
    setFilteredFiles(files);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <Button 
            variant="ghost"
            onClick={() => {
              fetch('/api/auth/signout', { method: 'POST' });
              window.location.href = '/login';
            }}
            className="text-red-600 hover:text-red-800 flex gap-2"
          >
            <LogOutIcon className="h-5 w-5" />
            Logout
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
            <FileUpload onUploadSuccess={fetchFiles} />
            
            {/* Search Bar */}
            <div className="mt-8 space-y-4">
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Search by name or content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSemanticSearch()}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSemanticSearch}
                  disabled={isSearching || !searchQuery.trim()}
                >
                  {isSearching ? (
                    <Loader2Icon className="h-4 w-4 animate-spin" />
                  ) : (
                    <SearchIcon className="h-4 w-4" />
                  )}
                  <span className="ml-2">Search</span>
                </Button>
                {searchQuery && (
                  <Button variant="outline" onClick={handleResetSearch}>
                    Reset
                  </Button>
                )}
              </div>

              {/* File List Section */}
              <div className="mt-4">
                <h2 className="text-xl font-semibold mb-4">Uploaded Files</h2>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2Icon className="h-8 w-8 animate-spin text-gray-500" />
                  </div>
                ) : filteredFiles.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {searchQuery ? 'No matching files found' : 'No files uploaded yet'}
                  </div>
                ) : (
                  <FileList 
                    files={filteredFiles} 
                    onDelete={handleDelete}
                    isDeleting={isDeleting}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}