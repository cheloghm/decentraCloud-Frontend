import React, { useEffect, useState } from 'react';
import axios from 'axios';
import config from '../../config';
import Modal from '../Modal';

const { apiUrl } = config;

const NodeManagement = () => {
  const [nodes, setNodes] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [formData, setFormData] = useState({
    storage: '',
    nodeName: '',
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchNodes();
  }, []);

  const fetchNodes = async () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return;

    try {
      const response = await axios.get(`${apiUrl}/nodes/all`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setNodes(response.data);
    } catch (error) {
      console.error('Failed to fetch nodes:', error);
    }
  };

  const handleNodeSelect = async (nodeId) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return;

    try {
      const response = await axios.get(`${apiUrl}/nodemanagement/node/${nodeId}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setSelectedNode(response.data);
      setFormData({ 
        storage: response.data.storageStats ? response.data.storageStats.availableStorage : '', 
        nodeName: response.data.nodeName 
      });
    } catch (error) {
      console.error('Failed to fetch node details:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !selectedNode) return;

    try {
      await axios.put(`${apiUrl}/nodemanagement/node/${selectedNode.nodeId}`, formData, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setMessage('Node updated successfully');
      fetchNodes(); // Refresh the node list
      setSelectedNode(null); // Close modal
    } catch (error) {
      console.error('Failed to update node:', error);
      setMessage('Failed to update node');
    }
  };

  const handleDeleteNode = async (nodeId) => {
    if (!window.confirm('Are you sure you want to delete this node? This action cannot be undone.')) return;

    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return;

    try {
      await axios.delete(`${apiUrl}/nodemanagement/node/${nodeId}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setMessage('Node deleted successfully');
      fetchNodes(); // Refresh the node list
    } catch (error) {
      console.error('Failed to delete node:', error);
      setMessage('Failed to delete node');
    }
  };

  const calculateStoragePercentage = (used, available) => {
    return (used / available) * 100;
  };

  const getStorageBarColor = (usedPercentage) => {
    if (usedPercentage < 50) return { used: 'blue', free: 'green' };
    if (usedPercentage >= 50 && usedPercentage < 75) return { used: 'blue', free: 'yellow' };
    return { used: 'blue', free: 'red' };
  };

  return (
    <div>
      <h1>Node Management Dashboard</h1>
      <div>
        {nodes.map((node) => (
          <div key={node.id} onClick={() => handleNodeSelect(node.id)} style={styles.nodeCard}>
            <h2>{node.nodeName}</h2>
            <p>Online: {node.isOnline ? 'Yes' : 'No'}</p>
            <p>Endpoint: {node.endpoint}</p>
          </div>
        ))}
      </div>
      {selectedNode && (
        <Modal onClose={() => setSelectedNode(null)}>
          <form onSubmit={handleFormSubmit}>
            <h2>{selectedNode.nodeName}</h2>
            <p>Region: {selectedNode.region}</p>
            <p>Online: {selectedNode.isOnline ? 'Yes' : 'No'}</p>
            <p>Endpoint: {selectedNode.endpoint}</p>
            <h3>Storage Stats</h3>
            <div style={{ marginTop: '10px' }}>
              <p>Used Storage: {selectedNode.storageStats.usedStorage} / {selectedNode.storageStats.availableStorage} bytes</p>
              <div style={{ width: '100%', height: '30px', backgroundColor: getStorageBarColor(calculateStoragePercentage(selectedNode.storageStats.usedStorage, selectedNode.storageStats.availableStorage)).free, position: 'relative', borderRadius: '5px' }}>
                <div style={{ width: `${calculateStoragePercentage(selectedNode.storageStats.usedStorage, selectedNode.storageStats.availableStorage)}%`, height: '100%', backgroundColor: getStorageBarColor(calculateStoragePercentage(selectedNode.storageStats.usedStorage, selectedNode.storageStats.availableStorage)).used, borderRadius: '5px 0 0 5px' }}></div>
              </div>
            </div>
            <h3>Uptime</h3>
            <ul>
              {selectedNode.uptime.map((time, index) => (
                <li key={index}>{new Date(time).toLocaleString()}</li>
              ))}
            </ul>
            <h3>Downtime</h3>
            <ul>
              {selectedNode.downtime.map((downtime, index) => (
                <li key={index}>
                  <p>Critical Level: {downtime["Critical level"]}</p>
                  <p>Reason: {downtime.Reason}</p>
                  <p>Timestamp: {new Date(downtime.Timestamp).toLocaleString()}</p>
                </li>
              ))}
            </ul>
            <h3>Availability</h3>
            <p>Critical Level: {selectedNode.availability["Critical level"]}</p>
            <p>Reason: {selectedNode.availability.Reason}</p>
            <p>Timestamp: {new Date(selectedNode.availability.Timestamp).toLocaleString()}</p>
            <label>
              Node Name:
              <input
                type="text"
                name="nodeName"
                value={formData.nodeName}
                onChange={handleInputChange}
              />
            </label>
            <label>
              Storage:
              <input
                type="number"
                name="storage"
                value={formData.storage}
                onChange={handleInputChange}
              />
            </label>
            <button type="submit">Update</button>
            <button type="button" onClick={() => handleDeleteNode(selectedNode.id)} style={styles.deleteButton}>Delete</button>
            {message && <p>{message}</p>}
          </form>
        </Modal>
      )}
    </div>
  );
};

const styles = {
  nodeCard: {
    border: '1px solid #ccc',
    padding: '10px',
    margin: '10px',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  deleteButton: {
    backgroundColor: 'red',
    color: 'white',
    marginTop: '10px',
  },
};

export default NodeManagement;
