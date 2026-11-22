'use client';

/* Смена снимка члена сборной ✳ (22.11.2026, решение владельца продукта):
   меняет только сам спортсмен. Окно: выбрать файл или перетащить его в окно,
   потом обрезать (`react-easy-crop`): аватар — круг, фигура — портрет 3:4
   (снимок по пояс, до бёдер). Обрезанное собирается на холсте и уходит на
   сервер готовым файлом: аватар — JPEG 512×512, фигура — PNG 600×800 (PNG
   сохраняет прозрачность вырезанной фигуры). Предел — 8 МБ (наш, как на
   сервере). Загруженный снимок можно снять. */

import { Button, Modal } from '@heroui/react';
import { ImageUp } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import Cropper, { type Area } from 'react-easy-crop';

import { setMemberImage, type MemberImageKind } from '@/entities/national';
import { ModalSheet } from '@/shared/ui/ModalSheet';

const MAX = 8 * 1024 * 1024;
const SHAPE: Record<MemberImageKind, { title: string; aspect: number; round: boolean; out: { w: number; h: number }; type: string }> = {
  avatar: { title: 'Аватар', aspect: 1, round: true, out: { w: 512, h: 512 }, type: 'image/jpeg' },
  figure: { title: 'Фигура для баннера', aspect: 3 / 4, round: false, out: { w: 600, h: 800 }, type: 'image/png' },
};

async function cropToFile(src: string, area: Area, kind: MemberImageKind): Promise<File> {
  const { out, type } = SHAPE[kind];
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = src;
  });
  const canvas = document.createElement('canvas');
  canvas.width = out.w;
  canvas.height = out.h;
  canvas.getContext('2d')!.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, out.w, out.h);
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Не удалось собрать снимок'))), type, 0.9));
  return new File([blob], kind + (type === 'image/png' ? '.png' : '.jpg'), { type });
}

export function ImageDialog({ memberId, kind, has, onChanged, children }: {
  memberId: string;
  kind: MemberImageKind;
  has: boolean;
  onChanged: () => void;
  /** Вид кнопки, открывающей окно. */
  children: ReactNode;
}) {
  const shape = SHAPE[kind];
  const [open, setOpen] = useState(false);
  const [src, setSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => () => void (src && URL.revokeObjectURL(src)), [src]);
  const onCropComplete = useCallback((_: Area, px: Area) => setArea(px), []);

  function reset() {
    setSrc(null);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
    setArea(null);
    setError(null);
  }

  function take(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith('image/')) return setError('Нужен снимок: JPG, PNG или WebP.');
    if (file.size > MAX) return setError('Снимок — не больше 8 МБ.');
    setError(null);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
    setSrc(URL.createObjectURL(file));
  }

  async function run(file: File | null) {
    setBusy(true);
    setError(null);
    try {
      await setMemberImage(memberId, kind, file);
      setOpen(false);
      reset();
      onChanged();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label={shape.title} data-testid={'image-open-' + kind}>
        {children}
      </button>
      <ModalSheet
        isOpen={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) reset();
        }}
        size="md"
        testId={'image-dialog-' + kind}
      >
        <Modal.CloseTrigger />
        <Modal.Header>
          <Modal.Heading className="text-lg font-semibold">{shape.title}</Modal.Heading>
        </Modal.Header>
        <Modal.Body className="flex flex-col gap-4">
          <input
            ref={input}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            data-testid={'image-input-' + kind}
            onChange={(e) => {
              take(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
          {!src ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setOver(true);
              }}
              onDragLeave={() => setOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setOver(false);
                take(e.dataTransfer.files?.[0]);
              }}
              className={
                'flex h-72 flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed text-center transition-colors ' +
                (over ? 'border-brand-500 bg-brand-50' : 'border-neutral-300 bg-neutral-50')
              }
              data-testid="image-drop"
            >
              <ImageUp size={36} className="text-brand-500" aria-hidden />
              <span className="text-[14px] font-medium">Перетащите снимок сюда</span>
              <Button variant="tertiary" size="sm" className="rounded-xl" onPress={() => input.current?.click()} data-testid="image-pick">
                Выбрать файл
              </Button>
            </div>
          ) : (
            <>
              <div className="relative h-80 overflow-hidden rounded-xl bg-brand-800" data-testid="image-crop">
                <Cropper
                  image={src}
                  crop={crop}
                  zoom={zoom}
                  aspect={shape.aspect}
                  cropShape={shape.round ? 'round' : 'rect'}
                  showGrid={!shape.round}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </div>
              <label className="flex items-center gap-3 text-[13px] text-neutral-600">
                Масштаб
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.01}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="flex-1 accent-[var(--color-brand-500)]"
                  data-testid="image-zoom"
                />
              </label>
            </>
          )}
          {error && (
            <p className="m-0 text-[13px] text-red-600" data-testid="image-error">
              {error}
            </p>
          )}
        </Modal.Body>
        <Modal.Footer>
          {has && !src && (
            <Button variant="ghost" className="mr-auto rounded-xl text-red-600" isDisabled={busy} onPress={() => void run(null)} data-testid="image-remove">
              Снять снимок
            </Button>
          )}
          {src && (
            <Button variant="tertiary" className="mr-auto rounded-xl" onPress={reset} data-testid="image-other">
              Другой файл
            </Button>
          )}
          <Button variant="tertiary" className="rounded-xl" onPress={() => setOpen(false)}>
            Отмена
          </Button>
          <Button
            variant="primary"
            className="rounded-xl"
            isDisabled={!src || !area || busy}
            onPress={() => void (src && area && cropToFile(src, area, kind).then(run, (e: Error) => setError(e.message)))}
            data-testid="image-save"
          >
            Сохранить
          </Button>
        </Modal.Footer>
      </ModalSheet>
    </>
  );
}
