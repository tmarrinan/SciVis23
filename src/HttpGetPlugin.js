import $ from 'jquery';

export default {
    install: (app, options) => {
        app.config.globalProperties.getJSON = (url) => {
            return new Promise((resolve, reject) => {
                $.ajax({
                    dataType: 'json',
                    url: url,
                    success: (response) => {
                        resolve(response);
                    },
                    error: (status, message) => {
                        reject({status: status.status, message: status.statusText});
                    }
                });
            });
        };
        
        app.config.globalProperties.getCSV = (url) => {
            return new Promise((resolve, reject) => {
                $.ajax({
                    dataType: 'text',
                    url: url,
                    success: (response) => {
                        let csv = response.split(/\r?\n/).filter(el => el.length !== 0)
                                          .map(line => line.split(','));
                        
                        resolve(csv);
                    },
                    error: (status, message) => {
                        reject({status: status.status, message: status.statusText});
                    }
                });
            });
        };
    }
}