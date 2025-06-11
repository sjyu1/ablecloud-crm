import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import AlertComponent from '../../common/alertComponent'; 

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Business_history {
  issue: string;
  solution: string;
  status: string;
  issued: string;
}

const CreateHistoryModal: React.FC<ModalProps & { onSubmit: () => void }> = ({ isOpen, onClose, onSubmit }) => {
  const params = useParams();
  const [error, setError] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const [formData, setFormData] = useState<Business_history>({
    issue: '',
    solution: '',
    status: 'in_progress',
    issued: ''
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        issue: '',
        solution: '',
        status: 'in_progress',
        issued: ''
      });
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // onSubmit(newPassword);

    e.preventDefault();
    setError('');

    try {
      const response = await fetch(`/api/business/${params.id}/history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('사업 히스토리가 등록 되었습니다.');
        onClose();
        onSubmit();
      } else {
        throw new Error('사업 히스토리 등록을 실패했습니다.');
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      // onClose();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 w-1/3">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">히스토리 등록</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              이슈
            </label>
            <input
              type="text"
              name="issue"
              value={formData.issue}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              해결방안
            </label>
            <input
              type="text"
              name="solution"
              value={formData.solution}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              시작일
            </label>
            <input
              type="datetime-local"
              name="issued"
              value={formData.issued}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              상태
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="in_progress">진행중</option>
              <option value="resolved">완료</option>
              <option value="canceled">취소</option>
            </select>
          </div>
          {error && (
            <div className="text-red-500 text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
            >
              취소
            </button>
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
            >
              확인
            </button>
          </div>
        </form>
      </div>

      {/* Show the alert component when needed */}
      {showAlert && (
        <AlertComponent
          message={alertMessage} // Passing the success message here
          onClose={() => setShowAlert(false)} // Function to close the alert
        />
      )}
    </div>
  );
};

export default CreateHistoryModal;