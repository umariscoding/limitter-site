import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-light dark:bg-gray-dark/10 py-12 mt-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-md overflow-hidden gradient-bg flex items-center justify-center text-white font-bold text-lg">L</div>
              <span className="text-xl font-bold gradient-text">Limitter</span>
            </div>
            <p className="text-gray-dark dark:text-gray mb-4">
              Stay focused with smart website blocking and time management.
            </p>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-4">Product</h3>
            <ul className="space-y-2">
              <li><Link href="/features" className="text-gray-dark dark:text-gray hover:text-primary">Features</Link></li>
              <li><Link href="/dashboard" className="text-gray-dark dark:text-gray hover:text-primary">Dashboard</Link></li>
              <li><Link href="/checkout?overrides=1" className="text-gray-dark dark:text-gray hover:text-primary">Buy Overrides</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-4">Contact</h3>
            <ul className="space-y-2">
              <li className="text-gray-dark dark:text-gray">
                <span className="font-medium">Email:</span><br />
                <a href="mailto:support@Limitter.com" className="hover:text-primary">support@Limitter.com</a>
              </li>
              <li className="text-gray-dark dark:text-gray">
                <span className="font-medium">Support Hours:</span><br />
                Mon-Fri, 9am-5pm EST
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray pt-8 mt-8 text-center text-gray-dark dark:text-gray">
          <p>&copy; {new Date().getFullYear()} Limitter. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
} 