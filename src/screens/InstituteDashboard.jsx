import { useState, useEffect } from 'react';
import { Form, Button, Table, Container, Alert, Modal, Tab, Tabs, Badge } from 'react-bootstrap';
import axios from 'axios';

const InstituteDashboard = () => {
  const [file, setFile] = useState(null);
  const [examName, setExamName] = useState('');
  const [description, setDescription] = useState('');
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [examResults, setExamResults] = useState([]);
  const [activeTab, setActiveTab] = useState('upload');

  useEffect(() => {
    fetchUploads();
  }, []);

  const resetForm = () => {
    setFile(null);
    setExamName('');
    setDescription('');
    setError(null);
    setSuccess(null);
    // Reset the file input by clearing its value
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const fetchUploads = async () => {
    try {
      const response = await axios.get('/api/upload/my-uploads');
      setUploads(response.data);
    } catch (error) {
      console.error('Error fetching uploads:', error);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/json') {
      setFile(selectedFile);
      setError(null);
    } else {
      setFile(null);
      setError('Please select a valid JSON file');
      // Reset the file input
      e.target.value = '';
    }
  };

  const validateJsonContent = (content) => {
    if (!content.questions || !Array.isArray(content.questions)) {
      throw new Error('Invalid JSON format: missing questions array');
    }

    content.questions.forEach((q, index) => {
      if (!q.question) {
        throw new Error(`Question ${index + 1} is missing question text`);
      }
      if (!Array.isArray(q.options) || q.options.length !== 4) {
        throw new Error(`Question ${index + 1} must have exactly 4 options`);
      }
      if (typeof q.correctAnswer !== 'number' || q.correctAnswer < 0 || q.correctAnswer > 3) {
        throw new Error(`Question ${index + 1} has invalid correct answer index`);
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // First validate the JSON content
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const jsonContent = JSON.parse(e.target.result);
          validateJsonContent(jsonContent);

          const formData = new FormData();
          formData.append('file', file);
          formData.append('examName', examName);
          formData.append('description', description);

          await axios.post('/api/upload', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });

          setSuccess('Questions uploaded successfully!');
          fetchUploads();
          resetForm(); // Reset form after successful upload
          
        } catch (error) {
          setError(error.message);
        } finally {
          setLoading(false);
        }
      };

      reader.onerror = () => {
        setError('Error reading file');
        setLoading(false);
      };

      reader.readAsText(file);

    } catch (error) {
      setError(error.response?.data?.message || 'Failed to upload file');
      setLoading(false);
    }
  };

  const handleViewResults = async (examId) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/exams/results/${examId}`);
      setExamResults(response.data);
      setSelectedExam(uploads.find(u => u._id === examId));
      setShowResultsModal(true);
    } catch (error) {
      console.error('Error fetching results:', error);
      setError('Failed to fetch exam results');
    } finally {
      setLoading(false);
    }
  };

  const handleReleaseResults = async (examId) => {
    try {
      setLoading(true);
      await axios.post(`/api/exams/release/${examId}`);
      setSuccess('Results released successfully');
      await fetchUploads();
      if (selectedExam?._id === examId) {
        const response = await axios.get(`/api/exams/results/${examId}`);
        setExamResults(response.data);
      }
    } catch (error) {
      console.error('Error releasing results:', error);
      setError('Failed to release results: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-3">
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-3"
      >
        <Tab eventKey="upload" title="Upload Exam">
          <h2>Upload Exam Questions</h2>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Exam Name</Form.Label>
              <Form.Control
                type="text"
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
                placeholder="Enter exam name"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter exam description"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Upload JSON File</Form.Label>
              <Form.Control
                type="file"
                onChange={handleFileChange}
                accept="application/json"
                required
              />
              <Form.Text className="text-muted">
                Upload a JSON file containing exam questions. Each question must have 4 options and one correct answer.
              </Form.Text>
            </Form.Group>

            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}

            <Button type="submit" disabled={loading || !file || !examName || !description}>
              {loading ? 'Uploading...' : 'Upload Questions'}
            </Button>
          </Form>
        </Tab>

        <Tab eventKey="exams" title="Manage Exams">
          <h2>My Uploads</h2>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Exam Name</th>
                <th>Description</th>
                <th>Status</th>
                <th>Uploaded Date</th>
                <th>Total Questions</th>
                <th>Results</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {uploads.map((upload) => (
                <tr key={upload._id}>
                  <td>{upload.examName}</td>
                  <td>{upload.description}</td>
                  <td>
                    <Badge bg={
                      upload.status === 'approved' ? 'success' :
                      upload.status === 'rejected' ? 'danger' : 'warning'
                    }>
                      {upload.status}
                    </Badge>
                  </td>
                  <td>{new Date(upload.createdAt).toLocaleDateString()}</td>
                  <td>{upload.totalQuestions}</td>
                  <td>
                    {upload.status === 'approved' && (
                      <Button
                        variant="info"
                        size="sm"
                        onClick={() => handleViewResults(upload._id)}
                      >
                        View Results
                      </Button>
                    )}
                  </td>
                  <td>
                    {upload.status === 'approved' && !upload.resultsReleased && (
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleReleaseResults(upload._id)}
                      >
                        Release Results
                      </Button>
                    )}
                    {upload.resultsReleased && (
                      <Badge bg="success">Results Released</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Tab>
      </Tabs>

      {/* Results Modal */}
      <Modal
        show={showResultsModal}
        onHide={() => setShowResultsModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedExam?.examName} - Results
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {examResults.length === 0 ? (
            <Alert variant="info">No results available yet.</Alert>
          ) : (
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Score</th>
                  <th>Correct Answers</th>
                  <th>Submission Date</th>
                </tr>
              </thead>
              <tbody>
                {examResults.map((result) => (
                  <tr key={result._id}>
                    <td>{result.student?.name || 'N/A'}</td>
                    <td>{result.score?.toFixed(2) || '0.00'}%</td>
                    <td>
                      {result.correctAnswers} / {result.totalQuestions}
                    </td>
                    <td>{new Date(result.submittedAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default InstituteDashboard;
