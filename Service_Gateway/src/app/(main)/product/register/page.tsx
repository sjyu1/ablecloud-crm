'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface ProductForm {
  name: string;
  version: string;
  isoFilePath: string;
  cube_version: string;
  mold_version: string;
  glue_version: string;
  iso_builddate: string;
  cube_builddate: string;
  glue_builddate: string;
  mold_builddate: string;
  add_function: string;
  patch_function: string;
  issue_function: string;
}

export default function ProductRegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<ProductForm>({
    name: '',
    version: '',
    isoFilePath: '',
    cube_version: '',
    mold_version: '',
    glue_version: '',
    iso_builddate: '',
    cube_builddate: '',
    glue_builddate: '',
    mold_builddate: '',
    add_function: '',
    patch_function: '',
    issue_function: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const addRef = useRef<HTMLTextAreaElement>(null);
  const patchRef = useRef<HTMLTextAreaElement>(null);
  const issueRef = useRef<HTMLTextAreaElement>(null);
  
  useEffect(() => {
    if (addRef.current) {
      addRef.current.placeholder = "[Cube]\n- \n\n[Mold]\n- ";
    }
    if (patchRef.current) {
      patchRef.current.placeholder = "[Cube]\n- \n\n[Mold]\n- ";
    }
    if (issueRef.current) {
      issueRef.current.placeholder = "[Cube]\n- \n\n[Mold]\n- ";
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('제품이 등록되었습니다.');
      } else {
        throw new Error(response.status == 409? '이미 존재하는 제품명입니다.' : '제품 등록에 실패했습니다.');
      }

      router.push('/product');
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">제품 등록</h1>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                제품명
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                제품버전
              </label>
              <input
                type="text"
                name="version"
                value={formData.version}
                onChange={handleChange}
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                제품 ISO경로
              </label>
              <input
                type="text"
                name="isoFilePath"
                value={formData.isoFilePath}
                onChange={handleChange}
                placeholder="/v4.3.0/ABLESTACK-Diplo-v4.3.0.iso (https://download.ablecloud.io/ABLESTACK-ISO 이후 경로 입력)"
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ISO Build Date
              </label>
              <input
                type="text"
                name="iso_builddate"
                placeholder="Build Date (2025-01-01 형식)"
                value={formData.iso_builddate}
                onChange={handleChange}
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cube
              </label>
              <div className="flex space-x-4">
                <input
                  type="text"
                  name="cube_version"
                  placeholder="버전"
                  value={formData.cube_version}
                  onChange={handleChange}
                  className="w-1/4 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  name="cube_builddate"
                  placeholder="Build Date (2025-01-01 형식)"
                  value={formData.cube_builddate}
                  onChange={handleChange}
                  className="w-1/4 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Glue
              </label>
              <div className="flex space-x-4">
                <input
                  type="text"
                  name="glue_version"
                  placeholder="버전"
                  value={formData.glue_version}
                  onChange={handleChange}
                  className="w-1/4 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  name="glue_builddate"
                  placeholder="Build Date (2025-01-01 형식)"
                  value={formData.glue_builddate}
                  onChange={handleChange}
                  className="w-1/4 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mold
              </label>
              <div className="flex space-x-4">
                <input
                  type="text"
                  name="mold_version"
                  placeholder="버전"
                  value={formData.mold_version}
                  onChange={handleChange}
                  className="w-1/4 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  name="mold_builddate"
                  placeholder="Build Date (2025-01-01 형식)"
                  value={formData.mold_builddate}
                  onChange={handleChange}
                  className="w-1/4 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                추가 기능
              </label>
              <textarea
                id="text-input"
                name="add_function"
                value={formData.add_function ?? ''}
                onChange={handleChange}
                ref={addRef}
                rows={5}
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                패치 기능
              </label>
              <textarea
                id="text-input"
                name="patch_function"
                value={formData.patch_function ?? ''}
                onChange={handleChange}
                ref={patchRef}
                rows={5}
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                알려진 이슈
              </label>
              <textarea
                id="text-input"
                name="issue_function"
                value={formData.issue_function ?? ''}
                onChange={handleChange}
                ref={issueRef}
                rows={5}
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Link
              href="/product"
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              취소
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className={`px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? '처리 중...' : '등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 
