"use client";

import QRCode from "react-qr-code";

interface Props {
  joinToken: string;
}

export default function QRCodeDisplay({ joinToken }: Props) {
  const joinUrl = `${window.location.origin}/join/${joinToken}`;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
        <QRCode value={joinUrl} size={220} />
      </div>
      <div className="text-center">
        <p className="text-sm text-gray-500">Ссылка для присоединения:</p>
        <a
          href={joinUrl}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-blue-600 hover:underline break-all"
        >
          {joinUrl}
        </a>
      </div>
      <button
        onClick={() => navigator.clipboard.writeText(joinUrl)}
        className="px-4 py-2 rounded-xl border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
      >
        Копировать ссылку
      </button>
    </div>
  );
}
