export default class IbisdocService {

    constructor(ibisdocModel, codeView) {
        this.ibisdocModel = ibisdocModel;
        this.codeView = codeView;
    }

    getIbisdoc() {

        let cur = this;
        fetch('./media/ibisdoc.json', {
            method: 'GET'
        })
            .then(response => {
                return response.json()
            })
            .then(data => {
                cur.ibisdocModel.setIbisdoc(data);
            })
            .catch(err => {
              console.warn('Couldn\'t load pipe palette from local ibisdoc: ' + err);
              this.getDefaultIbisdoc();
            })

    }

    getDefaultIbisdoc() {
        let cur = this;
        fetch('https://cors-anywhere.herokuapp.com/https://ibis4example.ibissource.org/rest/ibisdoc/ibisdoc.json', {
            method: 'GET'
        })
            .then(response => {
                return response.json()
            })
            .then(data => {
                cur.ibisdocModel.setIbisdoc(data);
            })
            .catch(err => {
              alert("Couldn't load pipe palette");
              console.error('Couldn\'t load pipe palette from ibis4example: ' + err);
            })
    }
}
