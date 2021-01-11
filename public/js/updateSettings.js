//Update user Settings
/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

export const updateSettings = async (data, type) => {
  try {
    const url =
      type === 'password'
        ? '/api/v1/users/updateMyPassword'
        : '/api/v1/users/updateMe';
    const res = await axios({
      method: 'PATCH',
      url,
      data
    });
    if (user.data.status === 'success') {
      showAlert(
        'success',
        `Your ${type.toCapitalise()} Has Been Successfully Updated!`
      );
    }
  } catch (err) {
    showAlert('error', err.data.message);
  }
};
