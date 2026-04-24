import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { Edit, Trash2, ArrowLeft, FileCode } from 'lucide-react';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => { api.get(`/projects/${id}`).then(res => setProject(res.data)); }, [id]);

  const handleDelete = async () => { await api.delete(`/projects/${id}`); navigate('/projects'); };

  if (!project) return <div className="text-center py-8 text-gray-500">Loading...</div>;

  return (
    <div>
      <button onClick={() => navigate('/projects')} className="flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-4"><ArrowLeft className="w-4 h-4" /> Back</button>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          <div className="flex gap-2">
            <button onClick={() => navigate(`/projects/${id}/edit`)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Edit className="w-4 h-4" /> Edit</button>
            <button onClick={() => setShowDelete(true)} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"><Trash2 className="w-4 h-4" /> Delete</button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div><p className="text-xs text-gray-500">Blockchain</p><p className="font-medium">{project.blockchain}</p></div>
          <div><p className="text-xs text-gray-500">Status</p><p className="font-medium capitalize">{project.status}</p></div>
          <div><p className="text-xs text-gray-500">Owner</p><p className="font-medium">{project.user?.firstName} {project.user?.lastName}</p></div>
        </div>
        {project.description && <p className="text-gray-600">{project.description}</p>}
      </div>

      {project.contracts?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Contracts ({project.contracts.length})</h3>
          {project.contracts.map((c: any) => (
            <div key={c.id} onClick={() => navigate(`/contracts/${c.id}`)} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer border-b last:border-0">
              <FileCode className="w-4 h-4 text-blue-500" />
              <span className="font-medium text-gray-800">{c.name}</span>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{c.language}</span>
            </div>
          ))}
        </div>
      )}

      {showDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Project?</h3>
            <p className="text-gray-600 mb-4">This will permanently delete "{project.name}".</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowDelete(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
