import React from 'react';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import AlertComponent from '../../common/alertComponent'; 

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  // onSubmit: (newPassword: string) => void;
}

const PasswordChangeModal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  const params = useParams();
  const [error, setError] = useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [newPasswordCheck, setNewPasswordCheck] = React.useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // onSubmit(newPassword);

    e.preventDefault();
    setError('');

    try {
      // 패스워드 밸리데이션
      if (!validatePassword(newPassword)) {
        throw new Error('비밀번호는 8자 이상이어야 하며, 대문자/소문자/특수문자/숫자를 모두 포함해야 합니다.');
      }

      // 패스워드 확인
      if (newPassword !== newPasswordCheck) {
        throw new Error('비밀번호가 일치하지 않습니다.');
      }

      // const updateFormData = { ...formData}
      const response = await fetch(`/api/user/${params.id}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({newPassword}),
      });

      if (response.ok) {
        alert('사용자 비밀번호가 변경 되었습니다.');
      } else {
        throw new Error('사용자 비밀번호 변경에 실패했습니다.');
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      onClose();
    }
  };

  // 비밀번호 유효성 검사 함수
  const validatePassword = (password: string) => {
    const regex = {
      minLength: /.{8,}/, // 8자 이상
      hasNumber: /[0-9]/, // 숫자 포함
      hasUpperCase: /[A-Z]/, // 대문자 포함
      hasLowerCase: /[a-z]/, // 소문자 포함
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/, // 특수문자 포함
    };

    if (!regex.minLength.test(password) || !regex.hasNumber.test(password) || !regex.hasUpperCase.test(password) || !regex.hasLowerCase.test(password) || !regex.hasSpecialChar.test(password)) {
      return false;
    }

    return true;
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 w-1/3">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">비밀번호 변경</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">새 비밀번호 (비밀번호는 8자 이상, 대문자/소문자/특수문자/숫자를 모두 포함)</label>
            <input
              type="password"
              id="newPassword"
              className="w-full p-2 border border-gray-300 rounded-md"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="newPasswordCheck" className="block text-sm font-medium text-gray-700">새 비밀번호 확인</label>
            <input
              type="password"
              id="newPasswordCheck"
              className="w-full p-2 border border-gray-300 rounded-md"
              value={newPasswordCheck}
              onChange={(e) => setNewPasswordCheck(e.target.value)}
              required
            />
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
              저장
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

export default PasswordChangeModal;