import axios from 'axios';
import Cookies from "js-cookie";

export const detectFace = async (video) => {
  try {
    const formData = new FormData();
    formData.append('video', video);

    const response = await axios.post(`http://localhost:5000/detect-face`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${Cookies.get('token')}`
      },
    });

    // console.log(response.data.result);
    return response.data.result;
  } catch (e) {
    alert(e.response.data.message);
  }
};

export const getLabeledFaceDescriptions = async () => {
  try {
    const response = await axios.get(`http://localhost:5000/get-descriptors`,{
      headers: {
        'Authorization': `Bearer ${Cookies.get('token')}`
      }
    });

    console.log(response.data);
    return response.data;
  } catch (e) {
    alert(e.response.data.message);
  }
};
