/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import AdminPanel from './components/AdminPanel';
import PublicWebsite from './components/PublicWebsite';

export default function App() {
  const [path, setPath] = useState(window.location.pathname);
  const [hostname, setHostname] = useState(window.location.hostname);

  useEffect(() => {
    const handleLocationChange = () => {
      setPath(window.location.pathname);
      setHostname(window.location.hostname);
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const isAdminRoute = path.startsWith('/admin') || hostname.startsWith('admin.');

  return (
    <>
      <Toaster position="top-center" />
      {isAdminRoute ? <AdminPanel /> : <PublicWebsite />}
    </>
  );
}
