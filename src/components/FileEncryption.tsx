import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { encryptFile, decryptFile, EncryptionParams, EncryptedFileInfo } from '@/utils/encryptionApi';
import { 
  Lock, Unlock, Key, Upload, Loader2, AlertCircle, CheckCircle2, 
  RefreshCw, Download, File, FileX, Info, HelpCircle, AlertTriangle, ChevronRight, X, FileCheck
} from 'lucide-react';
import { cn, generateRandomKey } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface FileEncryptionProps {
    file?: File;
    onEncryptionComplete?: (fileInfo: EncryptedFileInfo) => void;
    onDecryptionComplete?: (decryptedFile: File) => void;
}

export function FileEncryption({
    file,
    onEncryptionComplete,
    onDecryptionComplete
}: FileEncryptionProps) {
    const [key, setKey] = useState('');
    const [algorithm, setAlgorithm] = useState<'AES' | 'DES' | 'TRIPLE_DES'>('AES');
    const [isEncrypting, setIsEncrypting] = useState(false);
    const [isDecrypting, setIsDecrypting] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(file || null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [progressValue, setProgressValue] = useState(0);
    const [progressStage, setProgressStage] = useState<string>('');
    const [mode, setMode] = useState<'encrypt' | 'decrypt'>('encrypt');
    const [fileEncrypted, setFileEncrypted] = useState<EncryptedFileInfo | null>(null);
    const [showAdvanced, setShowAdvanced] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const fileDropRef = useRef<HTMLDivElement>(null);
    const [dropActive, setDropActive] = useState(false);
    const [dropError, setDropError] = useState(false);

    // Update title when mode changes
    useEffect(() => {
        // Reset state when mode changes
        setSelectedFile(null);
        setFileEncrypted(null);
        setErrorMessage(null);
        setSuccessMessage(null);
    }, [mode]);

    // Handle file drop events
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setDropActive(true);
        setDropError(false);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        // Only set dropActive to false if we're leaving the drop target
        // and not entering a child element
        if (fileDropRef.current && !fileDropRef.current.contains(e.relatedTarget as Node)) {
            setDropActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDropActive(false);
        
        // Check if there are files and handle the first one
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            validateAndSetFile(e.dataTransfer.files[0]);
        } else {
            setDropError(true);
            setTimeout(() => setDropError(false), 2000);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            validateAndSetFile(e.target.files[0]);
        }
        
        // Reset the input value so the same file can be selected again
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const validateAndSetFile = (file: File) => {
        setErrorMessage(null);
        setSuccessMessage(null);
        
        // Check file size (100MB max)
        if (file.size > 100 * 1024 * 1024) {
            setErrorMessage('File is too large. Maximum file size is 100MB.');
            return;
        }
        
        // For decryption mode, validate file extension if needed
        if (mode === 'decrypt' && !file.name.toLowerCase().endsWith('.enc')) {
            setSuccessMessage('Note: Selected file doesn\'t have .enc extension, but we\'ll try to decrypt it anyway.');
        }
        
        setSelectedFile(file);
    };

    const handleGenerateKey = () => {
        const newKey = generateRandomKey();
        setKey(newKey);
        
        // Visual feedback for key generation
        const keyInput = document.getElementById('encryption-key') as HTMLInputElement;
        if (keyInput) {
            keyInput.classList.add('bg-primary/5');
            setTimeout(() => keyInput.classList.remove('bg-primary/5'), 300);
        }
    };

    // Simulate progress stages for user feedback
    const simulateProgressStages = (action: 'encrypt' | 'decrypt') => {
        const stages = {
            encrypt: [
                'Preparing file...',
                'Generating encryption parameters...',
                'Encrypting data...',
                'Finalizing encryption...'
            ],
            decrypt: [
                'Reading encrypted file...',
                'Validating encryption parameters...',
                'Decrypting data...',
                'Finalizing decryption...'
            ]
        };

        let currentStage = 0;
        setProgressStage(stages[action][currentStage]);
        
        const interval = setInterval(() => {
            // 25% chance to move to next stage when below 90%
            if (currentStage < stages[action].length - 1 && Math.random() > 0.75 && progressValue < 90) {
                currentStage++;
                setProgressStage(stages[action][currentStage]);
            }
            
            setProgressValue(prev => {
                if (prev >= 95) return prev; // Cap at 95% until complete
                
                // Start slow, go faster in the middle, slow down toward end
                let increment;
                if (prev < 30) increment = Math.random() * 1.5;
                else if (prev < 60) increment = Math.random() * 2.5;
                else if (prev < 85) increment = Math.random() * 1.5;
                else increment = Math.random() * 0.5;
                
                return Math.min(prev + increment, 95);
            });
        }, 200);
        
        return { 
            interval, 
            completeProgress: () => {
                clearInterval(interval);
                setProgressValue(100);
                setProgressStage('Operation completed successfully!');
                setTimeout(() => {
                    setProgressValue(0);
                    setProgressStage('');
                }, 1500);
            },
            failProgress: () => {
                clearInterval(interval);
                setProgressValue(0);
                setProgressStage('');
            }
        };
    };

    const triggerFileInput = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const resetForm = () => {
        setSelectedFile(null);
        setFileEncrypted(null);
        setErrorMessage(null);
        setSuccessMessage(null);
        setProgressValue(0);
        setProgressStage('');
        // Optionally reset the key too
        // setKey('');
    };

    const handleEncrypt = async () => {
        if (!selectedFile) {
            setErrorMessage('Please select a file to encrypt');
            return;
        }

        if (!key) {
            setErrorMessage('Please enter an encryption key');
            return;
        }

        if (key.length < 8) {
            setErrorMessage('Please enter a stronger key (minimum 8 characters)');
            return;
        }

        setIsEncrypting(true);
        setErrorMessage(null);
        setSuccessMessage(null);
        setFileEncrypted(null);
        
        const progress = simulateProgressStages('encrypt');

        try {
            const params: EncryptionParams = {
                file: selectedFile,
                key,
                algorithm,
                onProgress: (realProgress) => {
                    // Use real progress if provided by API
                    if (realProgress > 0) {
                        clearInterval(progress.interval);
                        setProgressValue(realProgress);
                    }
                }
            };

            const fileInfo = await encryptFile(params);
            progress.completeProgress();
            
            setFileEncrypted(fileInfo);
            setSuccessMessage(`File encrypted successfully! ${fileInfo.fileName} can now be downloaded.`);

            // Call the callback if provided
            if (onEncryptionComplete) {
                onEncryptionComplete(fileInfo);
            }
        } catch (error) {
            progress.failProgress();
            console.error('Encryption error:', error);
            setErrorMessage(error instanceof Error ? error.message : 'An error occurred during encryption');
        } finally {
            setIsEncrypting(false);
        }
    };

    const handleDecrypt = async () => {
        if (!selectedFile) {
            setErrorMessage('Please select a file to decrypt');
            return;
        }

        if (!key) {
            setErrorMessage('Please enter the decryption key');
            return;
        }

        setIsDecrypting(true);
        setErrorMessage(null);
        setSuccessMessage(null);
        
        const progress = simulateProgressStages('decrypt');

        try {
            const params: EncryptionParams = {
                file: selectedFile,
                key,
                algorithm,
                onProgress: (realProgress) => {
                    // Use real progress if provided by API
                    if (realProgress > 0) {
                        clearInterval(progress.interval);
                        setProgressValue(realProgress);
                    }
                }
            };

            const decryptedBlob = await decryptFile(params);
            progress.completeProgress();

            const decryptedFileName = selectedFile.name.replace(/\.enc$|\.encrypted$/i, '') || 'decrypted_file';
            
            const decryptedFile = new window.File(
                [decryptedBlob],
                decryptedFileName,
                { type: decryptedBlob.type || 'application/octet-stream' }
            );
            
            setSuccessMessage(`File decrypted successfully! ${decryptedFileName} is ready to download.`);

            // Call the callback if provided
            if (onDecryptionComplete) {
                onDecryptionComplete(decryptedFile);
            } else {
                // Download the file automatically
                const url = URL.createObjectURL(decryptedBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = decryptedFile.name;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
        } catch (error) {
            progress.failProgress();
            console.error('Decryption error:', error);
            setErrorMessage(error instanceof Error ? 
                error.message : 
                'An error occurred during decryption. Please check that you\'re using the correct key and file.'
            );
        } finally {
            setIsDecrypting(false);
        }
    };

    const downloadEncryptedFile = () => {
        if (!fileEncrypted) return;
        
        // Create a download link
        const a = document.createElement('a');
        a.href = fileEncrypted.downloadUrl;
        a.download = fileEncrypted.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        setSuccessMessage(`Downloading ${fileEncrypted.fileName}...`);
        setTimeout(() => setSuccessMessage(null), 3000);
    };

    const isProcessing = isEncrypting || isDecrypting;
    const fileTypeColor = getFileTypeColor(selectedFile?.type || '');

    return (
        <Card className="shadow-soft-lg transition-all duration-300 border border-border/50 overflow-hidden">
            <CardHeader className="pb-3 space-y-1.5">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-xl flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                            {mode === 'encrypt' ? <Lock size={18} /> : <Unlock size={18} />}
                        </div>
                        File {mode === 'encrypt' ? 'Encryption' : 'Decryption'}
                    </CardTitle>
                    <div className="flex gap-2">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className={cn(
                                "h-8 text-xs font-medium transition-colors", 
                                mode === 'encrypt' ? "bg-primary/10 text-primary border-primary/20" : ""
                            )}
                            onClick={() => setMode('encrypt')}
                            disabled={isProcessing}
                        >
                            <Lock size={14} className="mr-1" />
                            Encrypt
                        </Button>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className={cn(
                                "h-8 text-xs font-medium transition-colors", 
                                mode === 'decrypt' ? "bg-primary/10 text-primary border-primary/20" : ""
                            )}
                            onClick={() => setMode('decrypt')}
                            disabled={isProcessing}
                        >
                            <Unlock size={14} className="mr-1" />
                            Decrypt
                        </Button>
                    </div>
                </div>
                <CardDescription>
                    {mode === 'encrypt' 
                        ? "Securely encrypt files with strong cryptographic algorithms." 
                        : "Decrypt previously encrypted files with the correct key."}
                </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
                {/* File drop area */}
                <div 
                    ref={fileDropRef}
                    className={cn(
                        "border-2 border-dashed rounded-lg transition-all duration-300 relative",
                        dropActive ? "border-primary bg-primary/5 scale-[1.01]" : "border-border",
                        dropError ? "border-destructive bg-destructive/5" : "",
                        selectedFile ? "bg-muted/20" : "bg-transparent",
                        !isProcessing && "hover:border-primary/50 hover:bg-primary/5 cursor-pointer"
                    )}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={isProcessing ? undefined : triggerFileInput}
                >
                    <div className="p-6 flex flex-col items-center text-center">
                        {selectedFile ? (
                            <>
                                <div className={cn(
                                    "w-12 h-12 rounded-full flex items-center justify-center mb-3",
                                    `bg-${fileTypeColor}-100 dark:bg-${fileTypeColor}-900/20`
                                )}>
                                    <FileCheck size={20} className={`text-${fileTypeColor}-600 dark:text-${fileTypeColor}-400`} />
                                </div>
                                <h3 className="font-medium text-base mb-1">{selectedFile.name}</h3>
                                <p className="text-xs text-muted-foreground mb-2">
                                    {bytesToSize(selectedFile.size)} • {selectedFile.type || 'Unknown type'}
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="text-xs h-7"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            triggerFileInput();
                                        }}
                                        disabled={isProcessing}
                                    >
                                        <Upload size={12} className="mr-1.5" />
                                        Change file
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="text-xs text-destructive hover:text-destructive/80 hover:bg-destructive/10 h-7"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedFile(null);
                                        }}
                                        disabled={isProcessing}
                                    >
                                        <FileX size={12} className="mr-1.5" />
                                        Remove file
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                    <Upload size={28} className="text-primary" />
                                </div>
                                <h3 className="font-medium text-lg mb-2">
                                    {mode === 'encrypt' ? 'Choose a File to Encrypt' : 'Choose an Encrypted File'}
                                </h3>
                                <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                                    Drag and drop a file here, or click to browse your files
                                </p>
                                <div className="flex items-center justify-center text-xs text-muted-foreground space-x-2">
                                    <span className="flex items-center">
                                        <AlertTriangle size={12} className="mr-1 text-amber-500" />
                                        Max size: 100MB
                                    </span>
                                    {mode === 'decrypt' && (
                                        <>
                                            <span className="w-1 h-1 rounded-full bg-border" />
                                            <span className="flex items-center">
                                                <File size={12} className="mr-1 text-blue-400" />
                                                Supports .enc files
                                            </span>
                                        </>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        className="hidden"
                        disabled={isProcessing}
                    />
                </div>

                {/* Encryption key */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label htmlFor="encryption-key" className="block text-sm font-medium">
                            {mode === 'encrypt' ? 'Encryption Key' : 'Decryption Key'}
                        </label>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                                        onClick={handleGenerateKey}
                                        disabled={isProcessing}
                                    >
                                        <RefreshCw size={12} className="mr-1" />
                                        Generate Random Key
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top">
                                    <p className="text-xs">
                                        Generates a cryptographically strong random key.
                                        <br />
                                        Save this key as you'll need it to decrypt the file later.
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                    <div className="relative">
                        <Key size={16} className="absolute top-1/2 left-3 transform -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        <input
                            id="encryption-key"
                            type="text"
                            value={key}
                            onChange={(e) => setKey(e.target.value)}
                            placeholder={mode === 'encrypt' 
                                ? "Enter or generate a secure encryption key" 
                                : "Enter the exact key used to encrypt the file"}
                            className="w-full p-2.5 pl-9 border rounded-md focus:ring-2 ring-primary/30 transition-all"
                            required
                            disabled={isProcessing}
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-1">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-foreground transition-colors"
                                onClick={handleGenerateKey}
                                disabled={isProcessing}
                                aria-label="Generate random key"
                            >
                                <RefreshCw size={14} />
                            </Button>
                        </div>
                    </div>
                    <p className={cn(
                        "text-xs flex items-start gap-1.5 transition-colors",
                        key.length > 0 && key.length < 8 ? "text-amber-500" : "text-muted-foreground"
                    )}>
                        <Info size={12} className="mt-0.5 flex-shrink-0" />
                        <span>
                            {mode === 'encrypt' 
                                ? key.length > 0 && key.length < 8 
                                    ? "Warning: Short keys can be easily cracked. Use at least 8 characters." 
                                    : "Keep this key safe. You'll need it to decrypt your file later."
                                : "Enter the exact key that was used for encryption."}
                        </span>
                    </p>
                </div>

                {/* Advanced options section */}
                <div className="space-y-2">
                    <button
                        type="button"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="text-sm font-medium flex items-center text-primary hover:text-primary/80 transition-colors"
                        disabled={isProcessing}
                    >
                        <ChevronRight 
                            size={16} 
                            className={cn(
                                "transition-transform mr-1",
                                showAdvanced && "transform rotate-90"
                            )} 
                        />
                        Advanced Options
                    </button>
                    
                    {showAdvanced && (
                        <div className="pt-2 animate-slideDown">
                            <div className="space-y-3">
                                {/* Algorithm selection */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="block text-sm font-medium">
                                            Encryption Algorithm
                                        </label>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        type="button"
                                                        variant="ghost" 
                                                        size="sm"
                                                        className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                                                        disabled={isProcessing}
                                                    >
                                                        <HelpCircle size={12} className="mr-1" />
                                                        Algorithm Help
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent side="top" className="max-w-xs">
                                                    <div className="space-y-1 text-xs">
                                                        <p className="font-bold">Algorithm Comparison:</p>
                                                        <ul className="space-y-1.5 ml-2">
                                                            <li className="flex items-start">
                                                                <span className="font-semibold mr-1">AES:</span> 
                                                                <span>Most secure, modern standard encryption.</span>
                                                            </li>
                                                            <li className="flex items-start">
                                                                <span className="font-semibold mr-1">DES:</span> 
                                                                <span>Older, less secure standard (not recommended).</span>
                                                            </li>
                                                            <li className="flex items-start">
                                                                <span className="font-semibold mr-1">Triple DES:</span> 
                                                                <span>More secure than DES, but slower than AES.</span>
                                                            </li>
                                                        </ul>
                                                    </div>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <button
                                            type="button"
                                            className={cn(
                                                "border rounded-md py-2.5 px-3 text-center text-sm transition-all",
                                                algorithm === 'AES' 
                                                    ? "bg-primary text-primary-foreground font-medium shadow-sm" 
                                                    : "bg-card hover:bg-muted/50",
                                                isProcessing && "opacity-50 cursor-not-allowed"
                                            )}
                                            onClick={() => setAlgorithm('AES')}
                                            disabled={isProcessing}
                                        >
                                            AES
                                        </button>
                                        <button
                                            type="button"
                                            className={cn(
                                                "border rounded-md py-2.5 px-3 text-center text-sm transition-all",
                                                algorithm === 'DES' 
                                                    ? "bg-primary text-primary-foreground font-medium shadow-sm" 
                                                    : "bg-card hover:bg-muted/50",
                                                isProcessing && "opacity-50 cursor-not-allowed"
                                            )}
                                            onClick={() => setAlgorithm('DES')}
                                            disabled={isProcessing}
                                        >
                                            DES
                                        </button>
                                        <button
                                            type="button"
                                            className={cn(
                                                "border rounded-md py-2.5 px-3 text-center text-sm transition-all",
                                                algorithm === 'TRIPLE_DES' 
                                                    ? "bg-primary text-primary-foreground font-medium shadow-sm" 
                                                    : "bg-card hover:bg-muted/50",
                                                isProcessing && "opacity-50 cursor-not-allowed"
                                            )}
                                            onClick={() => setAlgorithm('TRIPLE_DES')}
                                            disabled={isProcessing}
                                        >
                                            Triple DES
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Progress indicator */}
                {progressValue > 0 && (
                    <div className="space-y-3 pt-2 animate-fadeIn">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2 text-sm">
                                <Loader2 
                                    className={cn(
                                        "h-4 w-4", 
                                        progressValue < 100 ? "animate-spin" : ""
                                    )} 
                                />
                                <span className="text-muted-foreground">{progressStage}</span>
                            </div>
                            <span className="text-xs font-medium">
                                {progressValue < 100 ? `${Math.round(progressValue)}%` : 'Complete'}
                            </span>
                        </div>
                        <Progress value={progressValue} className="h-1.5" />
                    </div>
                )}

                {/* Success message */}
                {successMessage && (
                    <div className="flex gap-3 bg-green-500/10 text-green-700 dark:text-green-400 p-3 rounded-md animate-fadeIn">
                        <CheckCircle2 size={18} className="text-green-500 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        <div className="space-y-1 flex-1">
                            <p className="font-medium">{mode === 'encrypt' ? 'Encryption Successful' : 'Decryption Successful'}</p>
                            <p className="text-sm">{successMessage}</p>
                            {fileEncrypted && (
                                <div className="pt-1">
                                    <Button 
                                        size="sm" 
                                        className="h-7 mt-1 text-xs bg-green-600 hover:bg-green-700 text-white"
                                        onClick={downloadEncryptedFile}
                                    >
                                        <Download size={12} className="mr-1.5" />
                                        Download Encrypted File
                                    </Button>
                                </div>
                            )}
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 flex-shrink-0 text-green-700 dark:text-green-400 self-start"
                            onClick={() => setSuccessMessage(null)}
                        >
                            <X size={14} />
                        </Button>
                    </div>
                )}

                {/* Error messages */}
                {errorMessage && (
                    <div className="flex gap-3 bg-destructive/10 text-destructive p-3 rounded-md animate-fadeIn">
                        <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                        <div className="space-y-1 flex-1">
                            <p className="font-medium">Error</p>
                            <p className="text-sm">{errorMessage}</p>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 flex-shrink-0 text-destructive self-start"
                            onClick={() => setErrorMessage(null)}
                        >
                            <X size={14} />
                        </Button>
                    </div>
                )}
            </CardContent>

            <CardFooter className="flex flex-col sm:flex-row gap-3 border-t pt-4">
                <Button
                    onClick={mode === 'encrypt' ? handleEncrypt : handleDecrypt}
                    disabled={isProcessing || !selectedFile || !key}
                    className="w-full sm:flex-1 shadow-sm"
                >
                    {isProcessing ? (
                        <>
                            <Loader2 size={16} className="mr-2 animate-spin" />
                            {isEncrypting ? 'Encrypting...' : 'Decrypting...'}
                        </>
                    ) : (
                        <>
                            {mode === 'encrypt' ? (
                                <>
                                    <Lock size={16} className="mr-2" />
                                    Encrypt File
                                </>
                            ) : (
                                <>
                                    <Unlock size={16} className="mr-2" />
                                    Decrypt File
                                </>
                            )}
                        </>
                    )}
                </Button>

                <Button
                    type="button"
                    variant="outline"
                    className="w-full sm:flex-1"
                    disabled={isProcessing || (!selectedFile && !key)}
                    onClick={resetForm}
                >
                    <X size={14} className="mr-2" />
                    Reset
                </Button>
            </CardFooter>
        </Card>
    );
}

// Helper function to get color based on file type
function getFileTypeColor(mimeType: string): string {
    if (!mimeType) return 'gray';
    
    if (mimeType.startsWith('image/')) return 'blue';
    if (mimeType.startsWith('video/')) return 'purple';
    if (mimeType.startsWith('audio/')) return 'pink';
    if (mimeType.includes('pdf')) return 'red';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'indigo';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'green';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'orange';
    if (mimeType.includes('text/')) return 'teal';
    
    return 'gray';
}

function bytesToSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}