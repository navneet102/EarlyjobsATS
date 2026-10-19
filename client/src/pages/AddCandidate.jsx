import { useNavigate } from 'react-router-dom';
import { post } from '../api';
import CandidateForm from '../components/CandidateForm';

export default function AddCandidate() {
  const navigate = useNavigate();

  async function create(values) {
    const candidate = await post('/candidates', values);
    navigate(`/candidates/${candidate._id}`);
  }

  return (
    <div>
      <div className="page-head">
        <h1>Add candidate</h1>
      </div>

      <div className="card">
        <CandidateForm
          onSubmit={create}
          submitLabel="Add candidate"
          onCancel={() => navigate('/candidates')}
        />
      </div>
    </div>
  );
}
