import axios from '../../utils/axios.js'; // Ensure this path is correct

const state = {
  appointment: {
    service_id: '',
    date: '',
    start_time: '',
    end_time: '',
  },
  availableSlots: [],
  user: null,
  token: localStorage.getItem('user-token') || '',
};

const mutations = {
  SET_APPOINTMENT(state, appointment) {
    state.appointment = appointment;
  },
  SET_AVAILABLE_SLOTS(state, slots) {
    state.availableSlots = slots;
  },
  SET_USER(state, user) {
    state.user = user;
  },
  SET_TOKEN(state, token) {
    state.token = token;
  },
};

const actions = {
async getAppointmentById({ commit }, appointmentId) {
    try {
      const response = await axios.get(`/api/appointments/${appointmentId}`);
      commit('SET_APPOINTMENT', response.data); // Make sure this mutation exists
      return response.data;
    } catch (error) {
      console.error('Error fetching appointment:', error);
      throw error;
    }
  },

async bookAppointment({ commit, dispatch }, appointmentData) {
  try {
    const response = await axios.post('/api/appointments', appointmentData);

    console.log('Full response from backend:', response.data);

    const appointmentId = response.data.appointment ? response.data.appointment.id : null;
    console.log('Appointment ID:', appointmentId);

    const token = response.data.token;
    localStorage.setItem('user-token', token);

    console.log('Appointment booked successfully:', response.data);

    await dispatch('auth/checkAuth', null, { root: true });

    return response.data;  // Ensure the response is returned to submitAppointment
  } catch (error) {
    console.error('Appointment booking failed:', error.response.data);
    throw error.response.data;
  }
},



  async fetchAvailableSlots({ commit }, { date, service_id }) {
    if (!date || !service_id) return;
    try {
      const response = await axios.get('/api/available-slots', {
        params: { date, service_id },
      });
      commit('SET_AVAILABLE_SLOTS', response.data);
    } catch (error) {
      console.error('Error fetching available slots:', error.response.data);
    }
  },

  setAppointment({ commit }, appointment) {
    commit('SET_APPOINTMENT', appointment);
  },

  async confirmBooking({ dispatch }, 
    { id, payment_method, stripePaymentMethodId = null }) {
  try {
    const payload = { payment_method };
    if (stripePaymentMethodId) {
      payload.stripePaymentMethodId = stripePaymentMethodId;
    }

const response = await axios.patch(`/api/appointments/${id}/confirm`, payload);
    
    // Assuming the backend response includes updated appointment info
    await dispatch('getAppointmentById', id);
    
    return response.data;
  } catch (error) {
    console.error('Error confirming booking:', error.response ? error.response.data : error);
    throw error.response ? error.response.data : error;
  }
},

async updateAppointmentStatus({ commit }, { id, payment_status, payment_method }) {
  try {
    const response = await axios.patch(`/api/appointments/${id}/update-status`, {
      payment_status,
      payment_method
    });

    // You can optionally update the appointment in the store after updating the status
    commit('SET_APPOINTMENT', response.data.appointment);

    return response.data; // Return response for further processing if needed
  } catch (error) {
    console.error('Error updating appointment status:', error.response ? error.response.data : error);
    throw error.response ? error.response.data : error;
  }
}


};

const getters = {
  currentAppointment: (state) => state.appointment,
  availableSlots: (state) => state.availableSlots,
  isAuthenticated: (state) => !!state.token,
  user: (state) => state.user,
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters,
};
