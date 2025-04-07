import React from 'react';

interface AlertComponentProps {
  message: string;
  onClose: () => void;
}

const AlertComponent: React.FC<AlertComponentProps> = ({ message, onClose }) => {
  return (
    <div className="fixed top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 mt-4 p-4 w-96 bg-green-100 border border-green-400 text-green-700 rounded-md shadow-lg flex items-center justify-between">
      <div>
        <span className="font-medium">Success: </span>{message}
      </div>
      <button
        className="ml-4 text-green-500 hover:text-green-700"
        onClick={onClose}
      >
        &#10006; {/* Close button (X) */}
      </button>
    </div>
  );
};

export default AlertComponent;
