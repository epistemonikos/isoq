import axios from 'axios'

export default class Api {
  static host = process.env.API_URL
  static getHeaders () {
    let authToken = localStorage.getItem('l_s')
    return {
      Authorization: `Token session="${authToken}"`
    }
  }

  static put (path, data) {
    return axios.put(Api.host + path, data, {headers: this.getHeaders()})
  }

  static get (path, data) {
    let options = {
      url: Api.host + path,
      method: 'GET',
      headers: this.getHeaders(),
      params: data
    }
    return axios(options)
  }

  static post (path, data) {
    return axios.post(Api.host + path, data, {headers: this.getHeaders()})
  }

  static delete (path, data) {
    return axios.delete(Api.host + path, {headers: this.getHeaders()})
  }
}
