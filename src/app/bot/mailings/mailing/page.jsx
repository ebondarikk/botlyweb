/* eslint-disable no-nested-ternary */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Code2,
  Braces,
  Eye,
  Link as LinkIcon,
  User,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Clock,
  Image as ImageIcon,
  MessageSquare,
  Send,
  History,
  Save,
  AlertTriangle,
} from 'lucide-react';
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import { Mark, Node, Extension } from '@tiptap/core';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useMailing } from '@/hooks/use-mailing';
import { createMailing, updateMailing, publishMailing } from '@/lib/api';
import BotLayout from '@/app/bot/layout';
import ImageUpload from '@/components/image-upload';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useBot } from '@/context/BotContext';

// Кастомное расширение для спойлеров
const SpoilerExtension = Mark.create({
  name: 'spoiler',
  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },
  parseHTML() {
    return [{ tag: 'tg-spoiler' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['tg-spoiler', HTMLAttributes, 0];
  },
  addCommands() {
    return {
      toggleSpoiler:
        () =>
        ({ commands }) => {
          return commands.toggleMark(this.name);
        },
    };
  },
});

// Расширение для ограничения возможностей StarterKit
const RestrictedStarterKit = StarterKit.configure({
  // Отключаем ненужные возможности
  heading: false,
  paragraph: true,
  bulletList: true, // Включаем стандартные списки
  orderedList: true,
  listItem: true,
  blockquote: true,
  horizontalRule: false,
  dropcursor: false,
  gapcursor: false,
  history: true,
  // Оставляем только поддерживаемые Telegram форматы
  bold: true,
  italic: true,
  strike: true,
  code: true,
});

// Компонент редактора
function TipTapEditor({ value, onChange }) {
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  const tiptapEditor = useEditor({
    extensions: [
      RestrictedStarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: 'noopener noreferrer nofollow',
        },
      }),
      Underline,
      SpoilerExtension,
    ],
    content: value?.html || '',
    onUpdate: ({ editor }) => {
      onChange({
        html: editor.getHTML(),
        text: editor.getText(),
      });
    },
  });

  // Обновляем контент при изменении value
  useEffect(() => {
    if (tiptapEditor && value?.html !== tiptapEditor.getHTML()) {
      tiptapEditor.commands.setContent(value?.html || '');
    }
  }, [value?.html, tiptapEditor]);

  const handleLinkSubmit = (e) => {
    e.preventDefault();
    if (linkUrl) {
      tiptapEditor.chain().focus().setLink({ href: linkUrl }).run();
    } else {
      tiptapEditor.chain().focus().unsetLink().run();
    }
    setLinkDialogOpen(false);
    setLinkUrl('');
  };

  const handleLinkClick = () => {
    const previousUrl = tiptapEditor.getAttributes('link').href;
    setLinkUrl(previousUrl || '');
    setLinkDialogOpen(true);
  };

  const handleInsertVariable = () => {
    tiptapEditor.chain().focus().insertContent('{name}').run();
  };

  if (!tiptapEditor) {
    return (
      <div className="min-h-[240px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="border-2 border-border rounded-md min-h-[240px] overflow-hidden bg-background shadow-sm">
        {tiptapEditor && (
          <div className="border-b border-border p-2">
            <div className="flex flex-nowrap items-center gap-1 overflow-x-auto pb-2">
              <div className="flex gap-1.5 shrink-0">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => tiptapEditor.chain().focus().toggleBold().run()}
                        className={`h-8 w-8 p-0 ${tiptapEditor.isActive('bold') ? 'bg-accent' : ''}`}
                      >
                        <Bold className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Жирный текст (Ctrl+B)</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => tiptapEditor.chain().focus().toggleItalic().run()}
                        className={`h-8 w-8 p-0 ${tiptapEditor.isActive('italic') ? 'bg-accent' : ''}`}
                      >
                        <Italic className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Курсив (Ctrl+I)</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => tiptapEditor.chain().focus().toggleUnderline().run()}
                        className={`h-8 w-8 p-0 ${tiptapEditor.isActive('underline') ? 'bg-accent' : ''}`}
                      >
                        <UnderlineIcon className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Подчеркнутый текст (Ctrl+U)</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => tiptapEditor.chain().focus().toggleStrike().run()}
                        className={`h-8 w-8 p-0 ${tiptapEditor.isActive('strike') ? 'bg-accent' : ''}`}
                      >
                        <Strikethrough className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Зачеркнутый текст</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <div className="w-px h-4 bg-border mx-1 shrink-0" />

              <div className="flex gap-1.5 shrink-0">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => tiptapEditor.commands.toggleBulletList()}
                        className="h-8 w-8 p-0"
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Маркированный список</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => tiptapEditor.commands.toggleOrderedList()}
                        className="h-8 w-8 p-0"
                      >
                        <ListOrdered className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Нумерованный список</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => tiptapEditor.chain().focus().toggleBlockquote().run()}
                        className={`h-8 w-8 p-0 ${tiptapEditor.isActive('blockquote') ? 'bg-accent' : ''}`}
                      >
                        <Quote className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Цитата</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <div className="w-px h-4 bg-border mx-1 shrink-0" />

              <div className="flex gap-1.5 shrink-0">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => tiptapEditor.chain().focus().toggleCode().run()}
                        className={`h-8 w-8 p-0 ${tiptapEditor.isActive('code') ? 'bg-accent' : ''}`}
                      >
                        <Code2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Моноширинный текст</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          const { from, to } = tiptapEditor.state.selection;
                          const text = tiptapEditor.state.doc.textBetween(from, to, '');
                          if (text) {
                            tiptapEditor.chain().focus().setNode('codeBlock').run();
                          }
                        }}
                        className={`h-8 w-8 p-0 ${tiptapEditor.isActive('codeBlock') ? 'bg-accent' : ''}`}
                      >
                        <Braces className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Блок кода</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => tiptapEditor.chain().focus().toggleSpoiler().run()}
                        className={`h-8 w-8 p-0 ${tiptapEditor.isActive('spoiler') ? 'bg-accent' : ''}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Спойлер (скрытый текст)</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={handleLinkClick}
                        className={`h-8 w-8 p-0 ${tiptapEditor.isActive('link') ? 'bg-accent' : ''}`}
                      >
                        <LinkIcon className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Вставить ссылку</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={handleInsertVariable}
                        className="h-8 w-8 p-0"
                      >
                        <User className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Вставить имя пользователя</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
        )}
        <EditorContent
          editor={tiptapEditor}
          className="p-4 prose prose-sm max-w-none [&_.ProseMirror]:min-h-[200px] [&_.ProseMirror]:text-base [&_.ProseMirror]:leading-relaxed [&_.ProseMirror]:text-foreground [&_.ProseMirror]:placeholder:text-muted-foreground [&_.ProseMirror]:outline-none [&_*]:focus:outline-none [&_*]:focus-visible:outline-none [&_tg-spoiler]:bg-muted/80 [&_tg-spoiler]:px-1 [&_tg-spoiler]:rounded [&_tg-spoiler]:border-dashed [&_tg-spoiler]:border [&_tg-spoiler]:border-muted-foreground/40 hover:[&_tg-spoiler]:bg-muted [&_blockquote]:border-l-2 [&_blockquote]:border-muted-foreground/40 [&_blockquote]:pl-4 [&_blockquote]:italic [&_pre]:bg-muted/50 [&_pre]:p-4 [&_pre]:rounded-md [&_pre]:font-mono [&_pre]:text-sm [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4"
        />
      </div>

      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Вставить ссылку</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleLinkSubmit} className="space-y-4 pt-4">
            <FormItem>
              <FormLabel>URL</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://example.com"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="h-11"
                />
              </FormControl>
            </FormItem>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setLinkDialogOpen(false);
                  setLinkUrl('');
                }}
              >
                Отмена
              </Button>
              <Button type="button" disabled={!linkUrl} onClick={handleLinkSubmit}>
                {tiptapEditor.isActive('link') ? 'Обновить' : 'Вставить'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1],
    },
  }),
};

export default function MailingFormPage() {
  const params = useParams();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);
  const [formChanged, setFormChanged] = useState(false);

  const { bot } = useBot(params.bot_id);

  const {
    mailing: existingMailing,
    loading,
    publishing,
    handlePublish,
  } = useMailing(params.bot_id, params.mailing_id);

  const form = useForm({
    defaultValues: {
      content: {
        html: '',
        text: '',
      },
      image: '',
    },
  });

  // Отслеживаем изменения формы
  useEffect(() => {
    const subscription = form.watch(() => {
      setFormChanged(true);
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Обновляем значения формы после загрузки данных
  useEffect(() => {
    if (existingMailing) {
      form.reset({
        content: {
          html: existingMailing.html_content || existingMailing.content || '',
          text: existingMailing.content || '',
        },
        image: existingMailing.image || '',
      });
      setFormChanged(false);
    }
  }, [existingMailing, form]);

  const handleImageChange = (val) => {
    form.setValue('image', val);
    setFormChanged(true);
  };

  const onPublish = async () => {
    if (formChanged) {
      toast.error('Сохраните изменения перед публикацией');
      return;
    }

    const success = await handlePublish();
    if (success) {
      setIsPublishDialogOpen(false);
    }
  };

  const onSubmit = async (values) => {
    setSaving(true);
    try {
      const mailingData = {
        content: values.content.text || '',
        html_content: values.content.html || '',
        image: values.image,
      };

      if (existingMailing) {
        await updateMailing(params.bot_id, params.mailing_id, mailingData);
        toast.success('Рассылка успешно сохранена');
        setFormChanged(false);
      } else {
        await createMailing(params.bot_id, mailingData);
        toast.success('Рассылка успешно создана');
      }
      navigate(-1);
    } catch (error) {
      toast.error('Ошибка при сохранении');
    } finally {
      setSaving(false);
    }
  };

  return (
    <BotLayout>
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="w-full px-4 md:px-8"
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 py-6"
        >
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">
              {existingMailing ? 'Редактировать рассылку' : 'Создать рассылку'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {existingMailing
                ? 'Измените содержимое рассылки'
                : 'Создайте новую рассылку для ваших подписчиков'}
            </p>
          </div>
        </motion.div>

        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center py-8"
          >
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr,300px] gap-6 sm:gap-8">
            {/* Основная колонка */}
            <div className="space-y-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={0}>
                    <Card className="custom-card border-border/50 overflow-hidden">
                      <CardHeader className="border-b bg-muted/40 px-6">
                        <div className="flex items-center gap-2">
                          <ImageIcon className="w-5 h-5 text-primary" />
                          <CardTitle className="text-base">Изображение</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6">
                        <FormField
                          control={form.control}
                          name="image"
                          render={({ field }) => (
                            <FormItem>
                              <div className="mt-2">
                                <ImageUpload
                                  value={field.value}
                                  preview={field.value || existingMailing?.preview_image}
                                  onChange={handleImageChange}
                                  className="flex flex-col sm:flex-row gap-4 items-start"
                                />
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={1}>
                    <Card className="custom-card border-border/50 overflow-hidden">
                      <CardHeader className="border-b bg-muted/40 px-6">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-5 h-5 text-primary" />
                          <CardTitle className="text-base">Содержимое рассылки</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6">
                        <FormField
                          control={form.control}
                          name="content"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <TipTapEditor value={field.value} onChange={field.onChange} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center gap-4 pt-2"
                  >
                    <Button
                      type="submit"
                      size="lg"
                      className="flex items-center gap-2"
                      disabled={saving}
                    >
                      <Save className="w-4 h-4" />
                      {saving ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                          Сохранение...
                        </div>
                      ) : (
                        'Сохранить'
                      )}
                    </Button>
                  </motion.div>
                </form>
              </Form>
            </div>

            {/* Правая колонка */}
            <div className="space-y-6">
              {existingMailing && (
                <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={2}>
                  <Card className="custom-card border-border/50 overflow-hidden">
                    <CardHeader className="border-b bg-muted/40 px-6">
                      <div className="flex items-center gap-2">
                        <Send className="w-5 h-5 text-primary" />
                        <CardTitle className="text-base">Публикация</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              <Button
                                type="button"
                                size="lg"
                                className="w-full flex items-center gap-2 justify-center"
                                onClick={() => setIsPublishDialogOpen(true)}
                                disabled={
                                  publishing ||
                                  formChanged ||
                                  (bot?.mailings_limit !== null && bot?.mailings_limit <= 0)
                                }
                              >
                                <Send className="w-4 h-4" />
                                {publishing ? (
                                  <div className="flex items-center gap-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                                    Публикация...
                                  </div>
                                ) : (
                                  'Опубликовать'
                                )}
                              </Button>
                            </div>
                          </TooltipTrigger>
                          {formChanged ? (
                            <TooltipContent side="left" sideOffset={20}>
                              <p>Сохраните изменения перед публикацией</p>
                            </TooltipContent>
                          ) : bot?.mailings_limit !== null && bot?.mailings_limit <= 0 ? (
                            <TooltipContent side="left" sideOffset={20}>
                              <p>
                                Лимит рассылок исчерпан. Для публикации новых рассылок необходимо
                                повысить тариф.
                              </p>
                            </TooltipContent>
                          ) : null}
                        </Tooltip>
                      </TooltipProvider>

                      {/* История публикаций */}
                      {existingMailing?.publishes?.length > 0 && (
                        <>
                          <div className="w-full h-px bg-border" />
                          <div>
                            <div className="flex items-center gap-2 mb-4">
                              <History className="w-5 h-5 text-primary" />
                              <h3 className="font-semibold text-base">История публикаций</h3>
                            </div>
                            <div className="space-y-3">
                              <AnimatePresence>
                                {existingMailing.publishes.map((publish, index) => (
                                  <motion.div
                                    key={publish.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                  >
                                    <Collapsible
                                      defaultOpen={!publish.done && !publish.error}
                                      className="border-b border-border"
                                    >
                                      <CollapsibleTrigger className="w-full group/item">
                                        <div className="flex items-center justify-between w-full py-2 hover:bg-muted/25 data-[state=open]:bg-muted/20 rounded-lg transition-all duration-200 ease-in-out cursor-pointer">
                                          <div className="flex items-center gap-4">
                                            {publish.done ? (
                                              <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                                            ) : publish.error ? (
                                              <XCircle className="w-5 h-5 text-destructive shrink-0" />
                                            ) : (
                                              <Clock className="w-5 h-5 text-amber-500 animate-pulse shrink-0" />
                                            )}
                                            <div className="text-sm font-medium">
                                              {new Date(publish.published_at).toLocaleString(
                                                'ru-RU',
                                                {
                                                  day: '2-digit',
                                                  month: '2-digit',
                                                  year: 'numeric',
                                                  hour: '2-digit',
                                                  minute: '2-digit',
                                                },
                                              )}
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <Badge
                                              variant={publish.done ? 'success' : 'warning'}
                                              className={`shrink-0 w-24 text-center flex items-center justify-center ${
                                                publish.done
                                                  ? 'bg-green-100 text-green-500'
                                                  : publish.error
                                                    ? 'bg-destructive/10 text-destructive'
                                                    : 'bg-amber-100 text-amber-500'
                                              }`}
                                            >
                                              {publish.done
                                                ? 'Завершено'
                                                : publish.error
                                                  ? 'Ошибка'
                                                  : 'В процессе'}
                                            </Badge>
                                            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-300 ease-in-out group-data-[state=open]/item:rotate-180" />
                                          </div>
                                        </div>
                                      </CollapsibleTrigger>
                                      <CollapsibleContent>
                                        <motion.div
                                          initial={{ opacity: 0, height: 0 }}
                                          animate={{ opacity: 1, height: 'auto' }}
                                          exit={{ opacity: 0, height: 0 }}
                                          className=" space-y-3 border-l-2 ml-1"
                                        >
                                          <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                              <div className="text-xs text-muted-foreground">
                                                Успешно отправлено
                                              </div>
                                              <div className="flex items-center gap-2 text-green-500">
                                                <CheckCircle2 className="w-4 h-4" />
                                                <span className="font-medium">
                                                  {publish.success}
                                                </span>
                                              </div>
                                            </div>
                                            <div className="space-y-1.5">
                                              <div className="text-xs text-muted-foreground">
                                                Не доставлено
                                              </div>
                                              <div className="flex items-center gap-2 text-destructive">
                                                <XCircle className="w-4 h-4" />
                                                <span className="font-medium">
                                                  {publish.failed}
                                                </span>
                                              </div>
                                            </div>
                                          </div>
                                        </motion.div>
                                      </CollapsibleContent>
                                    </Collapsible>
                                  </motion.div>
                                ))}
                              </AnimatePresence>
                            </div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>
          </div>
        )}
      </motion.div>

      <Dialog open={isPublishDialogOpen} onOpenChange={setIsPublishDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-primary" />
              Подтверждение публикации
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>
              Вы уверены, что хотите опубликовать эту рассылку? После публикации рассылка будет
              отправлена всем подписчикам.
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="ghost" onClick={() => setIsPublishDialogOpen(false)}>
              Отмена
            </Button>
            <Button
              type="button"
              onClick={onPublish}
              className="flex items-center gap-2"
              disabled={
                publishing ||
                formChanged ||
                (bot?.mailings_limit !== null && bot?.mailings_limit <= 0)
              }
            >
              <Send className="w-4 h-4" />
              Опубликовать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </BotLayout>
  );
}
