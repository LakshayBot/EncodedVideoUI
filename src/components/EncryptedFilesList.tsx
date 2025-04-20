import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
    getEncryptedFiles,
    downloadEncryptedFile,
    decryptFileById,
    type EncryptedFileListItem
} from '@/utils/encryptionApi';
import { 
    Download, Loader2, Unlock, File, X, RefreshCw, 
    Search, Filter, SortDesc, Shield, Eye, FileIcon, Calendar, 
    HardDrive, Lock, AlertCircle, CheckCircle, LogIn
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';

export function EncryptedFilesList() {
    const [files, setFiles] = useState<EncryptedFileListItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [decryptingFileId, setDecryptingFileId] = useState<string | null>(null);
    const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);
    const [decryptionKey, setDecryptionKey] = useState('');
    const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
    const [progressValue, setProgressValue] = useState(0);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewType, setPreviewType] = useState<'video' | 'image' | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'name' | 'size'>('newest');
    const [filterType, setFilterType] = useState<string | null>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const keyInputRef = useRef<HTMLInputElement>(null);

    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
        localStorage.getItem('isAuthenticated') === 'true'
    );
    const navigate = useNavigate();

    useEffect(() => {
        const checkAuth = () => {
            const isAuth = localStorage.getItem('isAuthenticated') === 'true';
            setIsAuthenticated(isAuth);
        };

        checkAuth();

        window.addEventListener('storage', checkAuth);
        return () => {
            window.removeEventListener('storage', checkAuth);
        };
    }, []);

    const handleAuthError = () => {
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        setError('Your session has expired. Please log in again.');
    };

    const loadFiles = async () => {
        if (!isAuthenticated) {
            setError('Please log in to view your encrypted files.');
            return;
        }

        setLoading(true);
        setError(null);
        setProgressValue(30);

        try {
            const encryptedFiles = await getEncryptedFiles();
            setFiles(encryptedFiles);
            setProgressValue(100);
            setTimeout(() => setProgressValue(0), 500);
        } catch (error) {
            console.error('Error loading encrypted files:', error);

            if (error instanceof Error && 
                (error.message.includes('401') || error.message.includes('Unauthorized'))) {
                handleAuthError();
            } else {
                setError(error instanceof Error ? error.message : 'Failed to load encrypted files');
            }

            setProgressValue(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            loadFiles();
        }
    }, [isAuthenticated]);

    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    useEffect(() => {
        if (searchQuery && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [searchQuery]);

    useEffect(() => {
        if (selectedFileId && keyInputRef.current) {
            keyInputRef.current.focus();
        }
    }, [selectedFileId]);

    const handleDownload = async (fileId: string) => {
        if (!isAuthenticated) {
            setError('Please log in to download files.');
            return;
        }

        setDownloadingFileId(fileId);
        setProgressValue(0);
        setError(null);

        try {
            const file = files.find(f => f.id === fileId);
            if (!file) {
                throw new Error('File not found');
            }

            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.random() * 15;
                setProgressValue(Math.min(progress, 95));
            }, 200);

            const blob = await downloadEncryptedFile(fileId, {
                onProgress: (progress) => {
                    if (progress > 0) {
                        clearInterval(interval);
                        setProgressValue(progress);
                    }
                }
            });

            clearInterval(interval);
            setProgressValue(100);

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            setSuccess(`${file.fileName} downloaded successfully`);
            setTimeout(() => setSuccess(null), 3000);

        } catch (error) {
            console.error('Error downloading file:', error);

            if (error instanceof Error && 
                (error.message.includes('401') || error.message.includes('Unauthorized'))) {
                handleAuthError();
            } else {
                setError(error instanceof Error ? error.message : 'Failed to download file');
            }
        } finally {
            setDownloadingFileId(null);
            setTimeout(() => setProgressValue(0), 500);
        }
    };

    const handleDecrypt = async (fileId: string) => {
        if (!isAuthenticated) {
            setError('Please log in to decrypt files.');
            return;
        }

        if (!decryptionKey) {
            setError('Please enter a decryption key');
            return;
        }

        setDecryptingFileId(fileId);
        setError(null);
        setProgressValue(0);
        closePreview();

        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 10;
            setProgressValue(Math.min(progress, 95));
        }, 200);

        try {
            const file = files.find(f => f.id === fileId);
            if (!file) {
                throw new Error('File not found');
            }

            const blob = await decryptFileById(fileId, decryptionKey, {
                onProgress: (progress) => {
                    if (progress > 0) {
                        clearInterval(interval);
                        setProgressValue(progress);
                    }
                }
            });

            clearInterval(interval);
            setProgressValue(100);

            if (file.contentType.startsWith('video/')) {
                const url = URL.createObjectURL(blob);
                setPreviewUrl(url);
                setPreviewType('video');
                setSuccess('File decrypted successfully. Preview displayed.');
            } else if (file.contentType.startsWith('image/')) {
                const url = URL.createObjectURL(blob);
                setPreviewUrl(url);
                setPreviewType('image');
                setSuccess('File decrypted successfully. Preview displayed.');
            } else {
                const fileName = file.fileName.replace(/_encrypted(?=\.[^.]+$|$)/, '_decrypted');
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                setSuccess(`${fileName} decrypted and downloaded`);
            }

            setDecryptionKey('');
            setSelectedFileId(null);
            setTimeout(() => setSuccess(null), 3000);

        } catch (error) {
            console.error('Error decrypting file:', error);

            if (error instanceof Error && 
                (error.message.includes('401') || error.message.includes('Unauthorized'))) {
                handleAuthError();
            } else {
                setError(error instanceof Error ? error.message : 'Failed to decrypt file');
            }
        } finally {
            clearInterval(interval);
            setDecryptingFileId(null);
            setTimeout(() => setProgressValue(0), 500);
        }
    };

    const closePreview = () => {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(null);
        setPreviewType(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent, fileId: string) => {
        if (e.key === 'Enter') {
            handleDecrypt(fileId);
        }
    };

    const filteredAndSortedFiles = files
        .filter(file => {
            if (searchQuery) {
                return file.fileName.toLowerCase().includes(searchQuery.toLowerCase());
            }
            if (filterType) {
                return file.contentType.startsWith(filterType);
            }
            return true;
        })
        .sort((a, b) => {
            switch (sortOrder) {
                case 'newest':
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                case 'oldest':
                    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                case 'name':
                    return a.fileName.localeCompare(b.fileName);
                case 'size':
                    return b.fileSize - a.fileSize;
                default:
                    return 0;
            }
        });

    const fileTypes = [...new Set(files.map(file => 
        file.contentType.split('/')[0] + '/'
    ))];

    const renderAuthPrompt = () => {
        if (isAuthenticated) return null;

        return (
            <div className="text-center py-12 border-2 border-dashed rounded-md bg-muted/20 animate-fade-in">
                <Shield className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <h3 className="text-lg font-medium mb-2">Authentication Required</h3>
                <p className="text-muted-foreground mb-4">
                    Please log in to view and manage your encrypted files.
                </p>
                <Button 
                    onClick={() => navigate('/login')} 
                    className="shadow-soft"
                >
                    <LogIn size={16} className="mr-2" />
                    Log In
                </Button>
            </div>
        );
    };

    return (
        <Card className="shadow-soft-lg border border-border/50 animate-fade-in">
            <CardHeader className="pb-3 space-y-1.5">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-xl flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                            <Shield size={18} />
                        </div>
                        Encrypted Files
                    </CardTitle>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={loadFiles}
                        disabled={loading}
                        className="shadow-soft-sm"
                    >
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <RefreshCw className="h-4 w-4 mr-1" />
                        )}
                        <span className="hidden sm:inline ml-1">Refresh</span>
                    </Button>
                </div>
                <CardDescription>
                    View and manage your encrypted files. Decrypt or download as needed.
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
                {renderAuthPrompt()}

                {isAuthenticated && (
                    <>
                        {previewUrl && previewType && (
                            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in">
                                <div className="bg-card rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col">
                                    <div className="flex justify-between items-center p-4 border-b">
                                        <h3 className="text-lg font-medium flex items-center gap-2">
                                            <Eye size={18} className="text-primary" />
                                            Decrypted Preview
                                        </h3>
                                        <div className="flex gap-2">
                                            <Button 
                                                variant="outline" 
                                                size="sm"
                                                onClick={() => {
                                                    if (previewUrl) {
                                                        const a = document.createElement('a');
                                                        a.href = previewUrl;
                                                        a.download = 'decrypted_file' + (previewType === 'video' ? '.mp4' : '.jpg');
                                                        document.body.appendChild(a);
                                                        a.click();
                                                        document.body.removeChild(a);
                                                    }
                                                }}
                                            >
                                                <Download size={14} className="mr-1" />
                                                Save File
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                onClick={closePreview}
                                                className="h-8 w-8"
                                            >
                                                <X size={18} />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="p-4 overflow-auto flex-1 flex items-center justify-center bg-black/30">
                                        {previewType === 'video' ? (
                                            <video 
                                                src={previewUrl} 
                                                controls 
                                                className="max-w-full max-h-[70vh] rounded-sm shadow-soft-md" 
                                            />
                                        ) : (
                                            <img 
                                                src={previewUrl} 
                                                alt="Decrypted preview" 
                                                className="max-w-full max-h-[70vh] rounded-sm shadow-soft-md" 
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {progressValue > 0 && (
                            <div className="space-y-2 animate-fade-in">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">
                                        {progressValue < 100 ? (
                                            decryptingFileId ? 'Decrypting...' : 
                                            downloadingFileId ? 'Downloading...' : 'Loading...'
                                        ) : 'Complete!'}
                                    </span>
                                    <span className="text-xs font-medium">{Math.round(progressValue)}%</span>
                                </div>
                                <Progress value={progressValue} className="h-1.5" />
                            </div>
                        )}

                        {error && (
                            <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm flex items-center gap-2 animate-fade-in">
                                <AlertCircle size={16} /> 
                                <span>{error}</span>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="ml-auto h-6 px-1" 
                                    onClick={() => setError(null)}
                                >
                                    Clear
                                </Button>
                            </div>
                        )}

                        {success && (
                            <div className="bg-green-500/10 text-green-700 dark:text-green-400 p-3 rounded-md text-sm flex items-center gap-2 animate-fade-in">
                                <CheckCircle size={16} /> 
                                <span>{success}</span>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="ml-auto h-6 px-1 text-green-700 dark:text-green-400" 
                                    onClick={() => setSuccess(null)}
                                >
                                    Dismiss
                                </Button>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3 pb-2">
                            <div className="relative flex-1">
                                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search files..."
                                    className="w-full pl-9 pr-3 py-2 text-sm border rounded-md"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    ref={searchInputRef}
                                />
                                {searchQuery && (
                                    <button
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        onClick={() => setSearchQuery('')}
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                            
                            <div className="flex gap-2">
                                <div className="relative group">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-xs flex items-center gap-1 shadow-soft-sm"
                                    >
                                        <Filter size={14} />
                                        {filterType ? filterType.split('/')[0] : 'All Types'}
                                    </Button>
                                    <div className="absolute right-0 top-full mt-1 bg-popover border rounded-md shadow-soft-lg p-1 w-36 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                                        <button
                                            className={cn(
                                                "w-full text-left px-2 py-1 text-xs rounded",
                                                !filterType ? "bg-primary/10 text-primary" : "hover:bg-muted"
                                            )}
                                            onClick={() => setFilterType(null)}
                                        >
                                            All Types
                                        </button>
                                        {fileTypes.map(type => (
                                            <button
                                                key={type}
                                                className={cn(
                                                    "w-full text-left px-2 py-1 text-xs rounded",
                                                    filterType === type ? "bg-primary/10 text-primary" : "hover:bg-muted"
                                                )}
                                                onClick={() => setFilterType(type)}
                                            >
                                                {type.split('/')[0]}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                
                                <div className="relative group">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-xs flex items-center gap-1 shadow-soft-sm"
                                    >
                                        <SortDesc size={14} />
                                        Sort
                                    </Button>
                                    <div className="absolute right-0 top-full mt-1 bg-popover border rounded-md shadow-soft-lg p-1 w-36 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                                        {[
                                            { id: 'newest', label: 'Newest First', icon: Calendar },
                                            { id: 'oldest', label: 'Oldest First', icon: Calendar },
                                            { id: 'name', label: 'By Name', icon: FileIcon },
                                            { id: 'size', label: 'By Size', icon: HardDrive }
                                        ].map(option => (
                                            <button
                                                key={option.id}
                                                className={cn(
                                                    "w-full text-left px-2 py-1 text-xs rounded flex items-center gap-1.5",
                                                    sortOrder === option.id ? "bg-primary/10 text-primary" : "hover:bg-muted"
                                                )}
                                                onClick={() => setSortOrder(option.id as any)}
                                            >
                                                <option.icon size={12} />
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {selectedFileId && (
                            <div className="border rounded-md p-4 bg-muted/20 animate-fade-in">
                                <div className="mb-3">
                                    <h3 className="text-sm font-medium mb-1 flex items-center gap-1.5">
                                        <Lock size={14} className="text-primary" />
                                        <span>Enter Decryption Key for <span className="font-semibold">{files.find(f => f.id === selectedFileId)?.fileName}</span></span>
                                    </h3>
                                    <div className="flex gap-2">
                                        <input
                                            type="password"
                                            value={decryptionKey}
                                            onChange={(e) => setDecryptionKey(e.target.value)}
                                            placeholder="Enter key to decrypt this file"
                                            className="flex-1 p-2 text-sm border rounded-md"
                                            onKeyDown={(e) => handleKeyDown(e, selectedFileId)}
                                            ref={keyInputRef}
                                        />
                                        <Button
                                            size="sm"
                                            onClick={() => handleDecrypt(selectedFileId)}
                                            disabled={decryptingFileId === selectedFileId || !decryptionKey}
                                            className="shadow-soft-sm"
                                        >
                                            {decryptingFileId === selectedFileId ? (
                                                <Loader2 size={14} className="mr-1 animate-spin" />
                                            ) : (
                                                <Unlock size={14} className="mr-1" />
                                            )}
                                            Decrypt
                                        </Button>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => { setSelectedFileId(null); setDecryptionKey(''); setError(null); }}
                                    className="text-xs"
                                >
                                    Cancel
                                </Button>
                            </div>
                        )}

                        {loading && files.length === 0 ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : filteredAndSortedFiles.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-md">
                                <Lock className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                <p>No encrypted files found</p>
                                {(searchQuery || filterType) && (
                                    <p className="text-sm mt-2">Try adjusting your search or filters</p>
                                )}
                            </div>
                        ) : (
                            <div className="divide-y rounded-md border overflow-hidden">
                                {filteredAndSortedFiles.map(file => (
                                    <div 
                                        key={file.id} 
                                        className={cn(
                                            "py-3 px-4 flex flex-col sm:flex-row items-start sm:items-center gap-3",
                                            "transition-colors hover:bg-muted/30",
                                            selectedFileId === file.id && "bg-primary/5 border-l-2 border-l-primary pl-[calc(1rem-2px)]"
                                        )}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-medium text-sm truncate flex items-center gap-1.5">
                                                {getFileIcon(file.contentType)}
                                                {file.fileName}
                                            </h3>
                                            <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-x-3 gap-y-1">
                                                <span className="flex items-center gap-1">
                                                    <FileIcon size={12} className="opacity-70" />
                                                    {file.contentType || 'Unknown type'}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <HardDrive size={12} className="opacity-70" />
                                                    {formatFileSize(file.fileSize)}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar size={12} className="opacity-70" />
                                                    <span title={format(new Date(file.createdAt), 'PPp')}>
                                                        {formatDistanceToNow(new Date(file.createdAt), { addSuffix: true })}
                                                    </span>
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex gap-1 flex-shrink-0 ml-auto">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 text-xs shadow-soft-sm"
                                                onClick={() => handleDownload(file.id)}
                                                disabled={!!downloadingFileId || !!decryptingFileId}
                                            >
                                                {downloadingFileId === file.id ? (
                                                    <Loader2 size={14} className="mr-1 animate-spin" />
                                                ) : (
                                                    <Download size={14} className="mr-1" />
                                                )}
                                                <span className="hidden sm:inline">Download</span>
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 text-xs shadow-soft-sm"
                                                onClick={() => { 
                                                    setSelectedFileId(file.id); 
                                                    setDecryptionKey(''); 
                                                    setError(null); 
                                                }}
                                                disabled={!!downloadingFileId || !!decryptingFileId}
                                            >
                                                <Unlock size={14} className="mr-1" />
                                                <span className="hidden sm:inline">Decrypt</span>
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
}

function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getFileIcon(contentType: string) {
    if (!contentType) return <File size={14} className="flex-shrink-0" />;
    
    if (contentType.startsWith('image/')) {
        return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
            <path d="M21 3.6V20.4C21 20.7314 20.7314 21 20.4 21H3.6C3.26863 21 3 20.7314 3 20.4V3.6C3 3.26863 3.26863 3 3.6 3H20.4C20.7314 3 21 3.26863 21 3.6Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3 16L10 13L21 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M16 10C14.8954 10 14 9.10457 14 8C14 6.89543 14.8954 6 16 6C17.1046 6 18 6.89543 18 8C18 9.10457 17.1046 10 16 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>;
    }
    
    if (contentType.startsWith('video/')) {
        return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
            <path d="M21 7V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V7C3 4 4.5 2 8 2H16C19.5 2 21 4 21 7Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M11.9 17.5C14.7 17.5 17 15.2 17 12.4V11.6C17 8.8 14.7 6.5 11.9 6.5C9.1 6.5 6.79999 8.8 6.79999 11.6V12.4C6.79999 15.2 9.1 17.5 11.9 17.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>;
    }
    
    if (contentType.startsWith('audio/')) {
        return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
            <path d="M6 9H2V15H6V9Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M22 9H18V15H22V9Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M18 12H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>;
    }
    
    if (contentType.includes('pdf')) {
        return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
            <path d="M21 7V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V7C3 4 4.5 2 8 2H16C19.5 2 21 4 21 7Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14.5 4.5V6.5C14.5 7.6 15.4 8.5 16.5 8.5H18.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8 13H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8 17H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>;
    }
    
    return <File size={14} className="flex-shrink-0" />;
}