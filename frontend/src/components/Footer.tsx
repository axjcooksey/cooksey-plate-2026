

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-gray-600">
          <div>
            <p>&copy; 2025 Cooksey Family. AFL Tipping Competition.</p>
          </div>
          <div className="mt-2 sm:mt-0">
            <p>
              Powered by{' '}
              <a 
                href="https://squiggle.com.au" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 underline"
              >
                Squiggle API
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}