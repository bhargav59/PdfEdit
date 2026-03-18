import ToolCard from "@/components/ToolCard";

const tools = [
  {
    title: "Merge PDF",
    description: "Combine multiple PDF files into a single document. Drag to reorder pages.",
    icon: "\uD83D\uDD00",
    href: "/tools/merge",
  },
  {
    title: "Split PDF",
    description: "Extract pages or split a PDF into separate files by page range.",
    icon: "\u2702\uFE0F",
    href: "/tools/split",
  },
  {
    title: "Compress PDF",
    description: "Reduce file size while maintaining quality. Perfect for email attachments.",
    icon: "\uD83D\uDDDC\uFE0F",
    href: "/tools/compress",
  },
  {
    title: "Convert PDF",
    description: "Convert PDF to other formats or convert documents to PDF.",
    icon: "\uD83D\uDD04",
    href: "/tools/convert",
  },
  {
    title: "Edit PDF",
    description: "Add text, draw, highlight, and white-out content directly on your PDF.",
    icon: "\u270F\uFE0F",
    href: "/tools/edit",
  },
];

export default function HomePage() {
  return (
    <div className="py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
          PDF Toolkit
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto">
          Free, fast, and secure PDF processing tools. Merge, split, compress, convert, and edit your PDF files in seconds.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {tools.map((tool) => (
          <ToolCard
            key={tool.href}
            title={tool.title}
            description={tool.description}
            icon={tool.icon}
            href={tool.href}
          />
        ))}
      </div>
    </div>
  );
}
