import ToolCard from "@/components/ToolCard";

const tools = [
  {
    title: "Merge PDF",
    description: "Combine multiple PDFs and images into one. Combine PDFs in the order you want with the easiest PDF merger available.",
    icon: "🔀",
    href: "/tools/merge",
  },
  {
    title: "Split PDF",
    description: "Separate one page or a whole set for easy conversion into independent PDF files.",
    icon: "✂️",
    href: "/tools/split",
  },
  {
    title: "Compress PDF",
    description: "Reduce file size while optimizing for maximal PDF quality. Perfect for email attachments.",
    icon: "🗜️",
    href: "/tools/compress",
  },
  {
    title: "Convert PDF",
    description: "Easily convert your PDF files into easy to edit documents. Convert PDF to other formats or convert documents to PDF.",
    icon: "🔄",
    href: "/tools/convert",
  },
  {
    title: "Edit PDF",
    description: "Add text, images, shapes or freehand annotations to a PDF document. Edit existing PDF text.",
    icon: "✏️",
    href: "/tools/edit",
  },
];

export default function HomePage() {
  return (
    <div className="py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
          Every tool you need to work with PDFs, <br/>100% free and easy to use
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto">
          Merge, split, compress, convert, and edit PDFs with just a few clicks. I built this personal PDF toolkit to make document processing simple, secure, and completely free.
        </p>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto mb-20">
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

      {/* Structured Data (JSON-LD) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "PDF Toolkit",
            "applicationCategory": "UtilitiesApplication",
            "operatingSystem": "All",
            "description": "Every tool you need to use PDFs, at your fingertips. 100% free and easy to use. Merge, split, compress, convert, and edit PDFs.",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            }
          })
        }}
      />
      
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "How to combine PDF files?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Open the Merge PDF tool. Drag and drop your files, reorder them if needed, and click merge to get a single document."
                }
              },
              {
                "@type": "Question",
                "name": "How to reduce PDF file size?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Open your document with the Compress PDF tool. We automatically optimize your file and give you a compressed version perfect for email."
                }
              }
            ]
          })
        }}
      />

      {/* EEAT Section */}
      <div className="max-w-4xl mx-auto mb-20 bg-blue-50 p-8 rounded-3xl shadow-sm border border-blue-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Hi, why I built this tool 👋</h2>
        <div className="flex flex-col md:flex-row gap-8 items-center">
          <div className="flex-1 text-gray-700 space-y-4 text-lg">
            <p>
              I got tired of clunky, subscription-based PDF tools that limit conversions or plaster watermarks all over your important documents.
            </p>
            <p>
              So, I decided to build my own optimized, secure, and <strong>100% free</strong> set of tools. Your files are processed securely and deleted promptly after use. Whether you are trying to merge files for work or compress a large scan for an email, I hope this makes your day a bit easier!
            </p>
          </div>
          <div className="w-full md:w-5/12 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 italic text-gray-600">
            "Finally, a PDF editor that actually works without bombarding me with ads or subscriptions. It's fast, well-designed, and reliable!"
            <div className="mt-4 flex items-center">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold mr-3">SJ</div>
              <div>
                <div className="font-semibold text-gray-900 not-italic">Sarah J.</div>
                <div className="text-xs not-italic text-gray-500">Digital Marketer</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How-To / FAQ Section */}
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">How-To PDF Guides</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
            <h3 className="text-xl font-bold mb-4 flex items-center text-gray-900">
              <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-3 text-sm">1</span> 
              How to combine PDF files
            </h3>
            <ol className="list-decimal list-outside text-gray-600 space-y-3 ml-4 pl-2 mb-6">
              <li>Open the <a href="/tools/merge" className="text-blue-600 hover:text-blue-800 font-medium">Merge PDF tool</a></li>
              <li>Drag and drop to reorder the files if needed</li>
              <li>Select your documents and click to merge</li>
              <li>Download your combined PDF document instantly</li>
            </ol>
            {/* Video Placeholder (Trend #4) */}
            <div className="bg-gray-50 rounded-xl p-4 text-center text-sm font-medium text-gray-500 border border-dashed border-gray-300">
               🎥 Watch how I merge PDFs in 10 seconds (Video coming soon)
            </div>
          </div>
          
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
            <h3 className="text-xl font-bold mb-4 flex items-center text-gray-900">
              <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-3 text-sm">2</span> 
              How to reduce PDF file size
            </h3>
            <ol className="list-decimal list-outside text-gray-600 space-y-3 ml-4 pl-2 mb-6">
              <li>Open your document with the <a href="/tools/compress" className="text-blue-600 hover:text-blue-800 font-medium">Compress PDF tool</a></li>
              <li>Our tool automatically configures the best quality to size ratio</li>
              <li>Compress and download your much smaller PDF</li>
              <li>Perfect for getting past email attachment limits</li>
            </ol>
            {/* Video Placeholder (Trend #4) */}
            <div className="bg-gray-50 rounded-xl p-4 text-center text-sm font-medium text-gray-500 border border-dashed border-gray-300">
               🎥 See how to compress files for email (Video coming soon)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
