import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { uploadFile } from '@/lib/api';

/**
 * Компонент для загрузки и отображения изображения.
 */
export default function ImageUpload({ preview, onChange, alt = 'Preview', className = '' }) {
  const [previewUrl, setPreviewUrl] = useState(preview || '');
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  // useEffect(() => setPreviewUrl(initialValue), [initialValue, setPreviewUrl]);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setLoading(true);

    try {
      const uploadedUrl = await uploadFile(file);
      setPreviewUrl(uploadedUrl.url);
      onChange(uploadedUrl.path);
    } catch (error) {
      console.error('Ошибка загрузки файла:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`flex items-center space-x-4 ${className}`}>
      {/* Превью изображения */}
      {previewUrl ? (
        <div className="relative w-64 h-64 overflow-hidden rounded-md flex items-center justify-center">
          <img src={previewUrl} alt={alt} className="object-cover w-full h-full" />
        </div>
      ) : (
        <div className="w-64 h-64 bg-gray-100 flex items-center justify-center text-sm text-gray-400 rounded-md">
          Нет фото
        </div>
      )}

      {/* Кнопка загрузки */}
      <div>
        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={handleClickUpload}
          disabled={loading}
        >
          {loading ? 'Загрузка...' : previewUrl ? 'Сменить фото' : 'Загрузить фото'}
        </Button>
        {fileName && !loading && <p className="text-xs text-gray-500 mt-1">Выбрано: {fileName}</p>}
      </div>

      {/* Скрытый input */}
      <Input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  );
}
