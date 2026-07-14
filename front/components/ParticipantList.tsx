import { Participant } from "@/lib/types";

interface Props {
  participants: Participant[];
}

export default function ParticipantList({ participants }: Props) {
  if (participants.length === 0) {
    return (
      <p className="text-gray-400 text-sm text-center py-8">
        Пока нет участников. Поделитесь QR-кодом!
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
          <tr>
            <th className="px-4 py-3 text-left">#</th>
            <th className="px-4 py-3 text-left">Имя</th>
            <th className="px-4 py-3 text-left">Телефон</th>
            <th className="px-4 py-3 text-left">Дата</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {participants.map((p, i) => (
            <tr key={p.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 text-gray-400">{i + 1}</td>
              <td className="px-4 py-3 font-medium text-gray-900">{p.user.name}</td>
              <td className="px-4 py-3 text-gray-500">{p.user.phone}</td>
              <td className="px-4 py-3 text-gray-400">
                {new Date(p.joined_at).toLocaleDateString("ru-RU")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
