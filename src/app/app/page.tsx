import React from 'react';

const AppPage = () => {
  const handleDownloadClick = () => {
    window.location.href = "https://www.indusappstore.com/apps/tools/vighnaharta-one/com.vighnhartaonlineservices.app?page=details&id=com.vighnhartaonlineservices.app";
  };

  return (
    <div className="min-h-screen bg-[--background] flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[--foreground]">Vighnaharta Online Services</h1>
          <p className="text-[--foreground] mt-2 opacity-80">Your trusted platform for digital services</p>
        </div>
        
        <div className="mb-8">
          <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-[--foreground]">Download Our App</h2>
          <p className="text-[--foreground] mt-2 opacity-80">Get the complete experience with our mobile app</p>
        </div>
        
        <button
          onClick={handleDownloadClick}
          className="w-full bg-[--primary] hover:bg-[--secondary] text-[--primary-foreground] font-medium py-3 px-4 rounded-lg transition duration-200"
        >
          Download / Open App
        </button>
        
        <p className="text-gray-500 text-sm mt-4">
          Redirecting to Indus Appstore
        </p>
      </div>
    </div>
  );
};

export default AppPage;