import { Globe, Mail, Phone } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-6">
      <div className="container mx-auto text-center">
        <div className="flex justify-center mb-4">
          <div className="flex items-center mr-6">
            <Globe className="w-5 h-5 mr-1" />
            <span>www.achiievo.com</span>
          </div>
          <div className="flex items-center mr-6">
            <Mail className="w-5 h-5 mr-1" />
            <span>support@achiievo.com</span>
          </div>
          <div className="flex items-center">
            <Phone className="w-5 h-5 mr-1" />
            <span>(123) 456-7890</span>
          </div>
        </div>
        <p className="text-sm">
          &copy; {new Date().getFullYear()} Achiievo. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
