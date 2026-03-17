import Link from "next/link";

interface ToolCardProps {
  title: string;
  description: string;
  icon: string;
  href: string;
}

export default function ToolCard({ title, description, icon, href }: ToolCardProps) {
  return (
    <Link
      href={href}
      className="block border border-gray-200 rounded-xl bg-white p-6 hover:shadow-lg hover:border-blue-300 transition-all duration-200 group"
    >
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-2">
        {title}
      </h3>
      <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
    </Link>
  );
}
