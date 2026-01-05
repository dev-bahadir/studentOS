// ============================================
// 📚 KNOWLEDGE VAULT IMPORTER COMPONENT
// src/components/KnowledgeVault/KnowledgeVault.tsx
// ============================================
// PDF Upload + AI Card Generation

'use client';

import React, { useRef, useState } from 'react';
import { aiService } from '@/services/aiIntegration.service';
import { useFlashcardEngine } from '@/hooks/useFlashcardEngine';
import styles from './KnowledgeVault.module.css';

interface KnowledgeVaultProps {
  onCardsGenerated?: (count: number) => void;
}

export const KnowledgeVault: React.FC<KnowledgeVaultProps> = ({
  onCardsGenerated,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [generationStatus, setGenerationStatus] = useState<string | null>(null);
  const [generatedCards, setGeneratedCards] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const flashcardEngine = useFlashcardEngine();

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
        setError(null);
      } else {
        setError('Please upload a PDF file');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
      setError(null);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleGenerateCards = async () => {
    if (!selectedFile) {
      setError('Please select a PDF file');
      return;
    }

    setIsLoading(true);
    setGenerationStatus('Parsing PDF...');
    setError(null);

    try {
      // Parse PDF
      setGenerationStatus('Extracting text from PDF...');
      const pdfResult = await aiService.parsePDF(selectedFile);

      // Generate Cards
      setGenerationStatus('Generating flashcards with AI...');
      const cardResult = await aiService.generateCards(pdfResult.content, {
        numberOfCards: 10,
        difficulty: 'mixed',
        language: 'en',
      });

      // Save Cards to DB
      setGenerationStatus('Saving cards to database...');
      let savedCount = 0;
      for (const card of cardResult.cards) {
        try {
          await flashcardEngine.createCard(
            card.front,
            card.back,
            card.category,
            card.difficulty
          );
          savedCount++;
        } catch (err) {
          console.error('Failed to save card:', err);
        }
      }

      setGeneratedCards(savedCount);
      setGenerationStatus(null);
      setSelectedFile(null);
      onCardsGenerated?.(savedCount);

      // Reset
      setTimeout(() => {
        setGeneratedCards(0);
      }, 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to generate cards'
      );
      setGenerationStatus(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>📚 Knowledge Vault</h2>
        <p className={styles.subtitle}>Upload PDFs to auto-generate flashcards</p>
      </div>

      {/* Upload Area */}
      <div
        className={`${styles.uploadArea} ${isDragging ? styles.dragging : ''} ${
          selectedFile ? styles.selected : ''
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileSelect}
          className={styles.hiddenInput}
        />

        <div className={styles.uploadContent}>
          {selectedFile ? (
            <>
              <div className={styles.fileIcon}>📄</div>
              <p className={styles.fileName}>{selectedFile.name}</p>
              <p className={styles.fileSize}>
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </>
          ) : (
            <>
              <div className={styles.uploadIcon}>📤</div>
              <p className={styles.uploadText}>
                Drag and drop your PDF here
              </p>
              <p className={styles.uploadSubtext}>or click to browse</p>
            </>
          )}
        </div>

        <button
          className={styles.uploadButton}
          onClick={handleUploadClick}
          disabled={isLoading}
        >
          {selectedFile ? 'Choose Different File' : 'Browse Files'}
        </button>
      </div>

      {/* Options */}
      {selectedFile && !isLoading && (
        <div className={styles.options}>
          <label className={styles.optionGroup}>
            <span className={styles.optionLabel}>Number of Cards</span>
            <select className={styles.select} defaultValue="10">
              <option value="5">5 cards</option>
              <option value="10">10 cards</option>
              <option value="20">20 cards</option>
              <option value="50">50 cards</option>
            </select>
          </label>

          <label className={styles.optionGroup}>
            <span className={styles.optionLabel}>Difficulty</span>
            <select className={styles.select} defaultValue="mixed">
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
              <option value="mixed">Mixed</option>
            </select>
          </label>
        </div>
      )}

      {/* Status Messages */}
      {generationStatus && (
        <div className={styles.statusMessage}>
          <div className={styles.spinner} />
          <p>{generationStatus}</p>
        </div>
      )}

      {error && (
        <div className={styles.errorMessage}>
          <span className={styles.errorIcon}>⚠️</span>
          <p>{error}</p>
        </div>
      )}

      {generatedCards > 0 && (
        <div className={styles.successMessage}>
          <span className={styles.successIcon}>✅</span>
          <p>Successfully generated {generatedCards} flashcards!</p>
        </div>
      )}

      {/* Action Buttons */}
      {selectedFile && !isLoading && (
        <div className={styles.actions}>
          <button
            className={styles.generateBtn}
            onClick={handleGenerateCards}
            disabled={isLoading}
          >
            Generate Flashcards
          </button>
          <button
            className={styles.cancelBtn}
            onClick={() => {
              setSelectedFile(null);
              setError(null);
            }}
            disabled={isLoading}
          >
            Clear
          </button>
        </div>
      )}

      {/* Info */}
      <div className={styles.infoSection}>
        <h3 className={styles.infoTitle}>How it works</h3>
        <ol className={styles.infoList}>
          <li>Upload a PDF file (lecture notes, textbook chapter, etc.)</li>
          <li>AI extracts key concepts and terminology</li>
          <li>Automatic flashcards are generated</li>
          <li>Cards added to your vault instantly</li>
          <li>Review with SM-2 spaced repetition</li>
        </ol>
      </div>

      {/* Supported Features */}
      <div className={styles.features}>
        <div className={styles.feature}>
          <span className={styles.featureIcon}>🤖</span>
          <p>AI-Powered</p>
        </div>
        <div className={styles.feature}>
          <span className={styles.featureIcon}>⚡</span>
          <p>Instant Generation</p>
        </div>
        <div className={styles.feature}>
          <span className={styles.featureIcon}>📱</span>
          <p>Mobile-Ready</p>
        </div>
        <div className={styles.feature}>
          <span className={styles.featureIcon}>✅</span>
          <p>Quality Assured</p>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeVault;
