import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { encryptFile, decryptFile, EncryptionParams, EncryptedFileInfo } from '@/utils/encryptionApi';
import { 
  Lock, Unlock, Key, Upload, Loader2, AlertCircle, CheckCircle2, 
  RefreshCw, Download, File, FileX, Info, HelpCircle, AlertTriangle, ChevronRight, X, FileCheck, Shield
} from 'lucide-react';
import { cn, generateRandomKey } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

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

    useEffect(() => {
        setSelectedFile(null);
        setFileEncrypted(null);
        setErrorMessage(null);
        setSuccessMessage(null);
    }, [mode]);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setDropActive(true);
        setDropError(false);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        if (fileDropRef.current && !fileDropRef.current.contains(e.relatedTarget as Node)) {
            setDropActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDropActive(false);
        
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
        
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const validateAndSetFile = (file: File) => {
        setErrorMessage(null);
        setSuccessMessage(null);
        
        if (file.size > 100 * 1024 * 1024) {
            setErrorMessage('File is too large. Maximum file size is 100MB.');
            return;
        }
        
        if (mode === 'decrypt' && !file.name.toLowerCase().endsWith('.enc')) {
            setSuccessMessage('Note: Selected file doesn\'t have .enc extension, but we\'ll try to decrypt it anyway.');
        }
        
        setSelectedFile(file);
    };

    const handleGenerateKey = () => {
        const newKey = generateRandomKey();
        setKey(newKey);
        
        const keyInput = document.getElementById('encryption-key') as HTMLInputElement;
        if (keyInput) {
            keyInput.classList.add('bg-primary/5');
            setTimeout(() => keyInput.classList.remove('bg-primary/5'), 300);
        }
    };

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
            if (currentStage < stages[action].length - 1 && Math.random() > 0.75 && progressValue < 90) {
                currentStage++;
                setProgressStage(stages[action][currentStage]);
            }
            
            setProgressValue(prev => {
                if (prev >= 95) return prev;
                
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

            if (onDecryptionComplete) {
                onDecryptionComplete(decryptedFile);
            } else {
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
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <Card className="shadow-soft-lg transition-all duration-300 border border-border/50 overflow-hidden">
                <CardHeader className="pb-3 space-y-1.5 bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-900/10">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-xl flex items-center gap-2">
                            <div className="p-2 rounded-md bg-blue-600 text-white shadow-sm">
                                {mode === 'encrypt' ? <Lock size={20} /> : <Unlock size={20} />}
                            </div>
                            File {mode === 'encrypt' ? 'Encryption' : 'Decryption'}
                        </CardTitle>
                        <div className="flex gap-2">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className={cn(
                                    "h-8 text-xs font-medium transition-colors", 
                                    mode === 'encrypt' ? "bg-blue-600 text-white border-blue-700 hover:bg-blue-700" : ""
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
                                    mode === 'decrypt' ? "bg-blue-600 text-white border-blue-700 hover:bg-blue-700" : ""
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
                            ? "Securely encrypt files with military-grade cryptographic protection." 
                            : "Decrypt previously encrypted files with the correct key."}
                    </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                    <div 
                        ref={fileDropRef}
                        className={cn(
                            "border-2 border-dashed rounded-lg transition-all duration-300 relative",
                            dropActive ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-[1.01]" : "border-border",
                            dropError ? "border-destructive bg-destructive/5" : "",
                            selectedFile ? "bg-muted/20" : "bg-transparent",
                            !isProcessing && "hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 cursor-pointer"
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
                                        "w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-blue-100 dark:bg-blue-900/30"
                                    )}>
                                        <FileCheck size={32} className="text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <h3 className="font-medium text-base mb-1">{selectedFile.name}</h3>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Badge variant="secondary" className="text-xs font-normal">
                                            {bytesToSize(selectedFile.size)}
                                        </Badge>
                                        <Badge variant="outline" className="text-xs font-normal">
                                            {selectedFile.type || 'Unknown type'}
                                        </Badge>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="text-xs h-8"
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
                                            className="text-xs text-destructive hover:text-destructive/80 hover:bg-destructive/10 h-8"
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
                                    <div className="w-20 h-20 rounded-full bg-blue-100/60 dark:bg-blue-900/20 flex items-center justify-center mb-4">
                                        <Upload size={34} className="text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <h3 className="font-medium text-lg mb-2">
                                        {mode === 'encrypt' ? 'Choose a File to Encrypt' : 'Choose an Encrypted File'}
                                    </h3>
                                    <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                                        Drag and drop a file here, or click to browse your files
                                    </p>
                                    <div className="flex items-center justify-center text-xs text-muted-foreground space-x-3">
                                        <span className="flex items-center px-2 py-1 bg-muted/60 rounded">
                                            <AlertTriangle size={12} className="mr-1.5 text-amber-500" />
                                            Max size: 100MB
                                        </span>
                                        {mode === 'decrypt' && (
                                            <span className="flex items-center px-2 py-1 bg-muted/60 rounded">
                                                <File size={12} className="mr-1.5 text-blue-500" />
                                                Supports .enc files
                                            </span>
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

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label htmlFor="encryption-key" className="flex items-center gap-2 text-sm font-medium">
                                <div className="p-1 rounded bg-blue-100 dark:bg-blue-900/30">
                                    <Key size={16} className="text-blue-600 dark:text-blue-400" />
                                </div>
                                {mode === 'encrypt' ? 'Encryption Key' : 'Decryption Key'}
                            </label>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
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
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Shield size={16} className="text-muted-foreground" />
                            </div>
                            <input
                                id="encryption-key"
                                type="text"
                                value={key}
                                onChange={(e) => setKey(e.target.value)}
                                placeholder={mode === 'encrypt' 
                                    ? "Enter or generate a secure encryption key" 
                                    : "Enter the exact key used to encrypt the file"}
                                className="w-full p-2.5 pl-10 border rounded-md focus:ring-2 ring-blue-400/30 transition-all"
                                required
                                disabled={isProcessing}
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-2">
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

                    <div className="space-y-2">
                        <button
                            type="button"
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="text-sm font-medium flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                            disabled={isProcessing}
                        >
                            <ChevronRight 
                                size={16} 
                                className={cn(
                                    "transition-transform mr-1.5",
                                    showAdvanced && "transform rotate-90"
                                )} 
                            />
                            Advanced Options
                        </button>
                        
                        <AnimatePresence>
                            {showAdvanced && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="pt-2 overflow-hidden"
                                >
                                    <div className="space-y-3 p-4 rounded-lg bg-muted/20 border">
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <label className="flex items-center gap-2 text-sm font-medium">
                                                    <HelpCircle size={15} className="text-blue-600" />
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
                                                        "border rounded-md py-2.5 px-3 text-center text-sm font-medium transition-all",
                                                        algorithm === 'AES' 
                                                            ? "bg-blue-600 text-white shadow-sm border-blue-600" 
                                                            : "bg-card hover:bg-muted/70 border-muted",
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
                                                        "border rounded-md py-2.5 px-3 text-center text-sm font-medium transition-all",
                                                        algorithm === 'DES' 
                                                            ? "bg-blue-600 text-white shadow-sm border-blue-600" 
                                                            : "bg-card hover:bg-muted/70 border-muted",
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
                                                        "border rounded-md py-2.5 px-3 text-center text-sm font-medium transition-all",
                                                        algorithm === 'TRIPLE_DES' 
                                                            ? "bg-blue-600 text-white shadow-sm border-blue-600" 
                                                            : "bg-card hover:bg-muted/70 border-muted",
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
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <AnimatePresence>
                        {progressValue > 0 && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }} 
                                animate={{ opacity: 1, y: 0 }} 
                                exit={{ opacity: 0 }}
                                className="space-y-3 pt-2"
                            >
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2 text-sm">
                                        <Loader2 
                                            className={cn(
                                                "h-4 w-4 text-blue-600", 
                                                progressValue < 100 ? "animate-spin" : ""
                                            )} 
                                        />
                                        <span className="text-blue-800 dark:text-blue-300 font-medium">{progressStage}</span>
                                    </div>
                                    <Badge variant={progressValue < 100 ? "outline" : "default"} className="text-xs px-2 py-0">
                                        {progressValue < 100 ? `${Math.round(progressValue)}%` : 'Complete'}
                                    </Badge>
                                </div>
                                <Progress 
                                    value={progressValue} 
                                    className="h-2 bg-blue-100 dark:bg-blue-900/30" 
                                    indicatorClassName="bg-blue-600"
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <AnimatePresence>
                        {successMessage && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                            >
                                <div className="flex gap-3 bg-green-500/10 text-green-700 dark:text-green-400 p-4 rounded-md">
                                    <CheckCircle2 size={20} className="text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                                    <div className="space-y-2 flex-1">
                                        <p className="font-medium text-green-800 dark:text-green-300">
                                            {mode === 'encrypt' ? 'Encryption Successful' : 'Decryption Successful'}
                                        </p>
                                        <p className="text-sm">{successMessage}</p>
                                        {fileEncrypted && (
                                            <div className="pt-2">
                                                <Button 
                                                    size="sm" 
                                                    className="h-8 text-xs bg-green-600 hover:bg-green-700 text-white shadow-sm"
                                                    onClick={downloadEncryptedFile}
                                                >
                                                    <Download size={14} className="mr-1.5" />
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
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <AnimatePresence>
                        {errorMessage && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                            >
                                <div className="flex gap-3 bg-destructive/10 text-destructive p-4 rounded-md">
                                    <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                                    <div className="space-y-1 flex-1">
                                        <p className="font-medium text-destructive">Error</p>
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
                            </motion.div>
                        )}
                    </AnimatePresence>
                </CardContent>

                <CardFooter className="flex flex-col sm:flex-row gap-3 border-t p-4 bg-muted/10">
                    <Button
                        onClick={mode === 'encrypt' ? handleEncrypt : handleDecrypt}
                        disabled={isProcessing || !selectedFile || !key}
                        className="w-full sm:flex-1 shadow-sm bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
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
        </motion.div>
    );
}

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