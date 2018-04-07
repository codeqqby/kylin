var global_config = {
    isPredict: false,
    canKill: false,
    canExport: false,
    isP5:false,
    config3: {
        isGroup: true,
        isDirect: true
    }
}


var app = new Vue({
    el:'#app',
    data:{
        sequence1:'1',
        sequence2:'2',
        sequence3:'3',
        sequence4:'4',
        sumValue:null,
        boldCode:null,
        wyfMessage:'这一行是统计数据展示区域',
        codesCount: 0,
        wyfCodes:[],
        config:global_config,
        welfareCode: null,
        boldCodeFive: null,
        myriabit: null,
        kilobit: null,
        hundred: null,
        decade:null,
        unit:null
    },
    methods:{
        doPermutate: function () {
            var paramArray = [];
            paramArray.push(this.sequence1);
            paramArray.push(this.sequence2);
            paramArray.push(this.sequence3);
            paramArray.push(this.sequence4);
            console.log('input:'+ JSON.stringify(paramArray));
            var args = {
                "riddles": paramArray,
                "targetCodeType": 3
            };
            axios({
              method: 'post',
              url: '/api/welfare/codes/predict',
              data: args
            }).then(function(response) {
                    console.log(response.data.data);
                    app.handleThreeCodeResponse(response.data.data);
                })
                .catch(function(error){
                    console.log(error)
                });

        },
        handleThreeCodeResponse:function (data) {
            if(!data){
                this.wyfMessage='远程服务返回数据为空';
                console.log('请求数据为空');
                return;
            }
            this.welfareCode = data;
            this.wyfCodes = this.welfareCode.codes;
            this.config.isPredict=true;
            this.config.canKill=true;
            this.config.canExport=true;
            if(this.welfareCode.codeTypeEnum == "DIRECT"){
                this.config.config3.isGroup = false;
                this.config.config3.isDirect = true;
                this.wyfMessage = "本次直选预测3D码: " + this.welfareCode.w3DCodes.length + " 注";
            }else {
                this.config.config3.isGroup = true;
                this.config.config3.isDirect = false;
                this.wyfMessage = "本次组选预测3D码: " + this.welfareCode.w3DCodes.length + " 注";
            }
        },

        handleFiveCodeResponse: function (data, msg) {
            console.log('data: ' + JSON.stringify(data, null, 2));
            this.config.isP5 = true;
            this.welfareCode = data;
            var printCodes = [];
            for( idx in this.welfareCode){
                code = this.welfareCode[idx];
                console.log('code:' + JSON.stringify(code, null, 2));
                code.codes.reverse();
                printCodes.push(code.codes.join(""));
            }
            console.log('输出：' + JSON.stringify(printCodes, null, 2));
            this.wyfCodes = printCodes;
            this.wyfMessage = "排5 " + msg + " 生成: "  + this.wyfCodes.length + " 注";
        },

        transfer2Direct: function () {
            if(!this.config.isPredict){
                this.handleException("请先完成预测");
                return;
            }

            if(this.config.config3.isDirect){
                this.handleException("已经是直选");
                return;
            }

            axios({
                method:"POST",
                url:"/api/welfare/codes/transfer",
                data: app.welfareCode,
                headers:{
                    "Content-Type": "application/json; charset=UTF-8"
                }
            }).then(function (response) {
                console.log("转码成功返回");
                app.handleThreeCodeResponse(response.data.data);
                console.log("转码完成");
                app.wyfMessage = "转码成功, 共计 " + app.welfareCode.w3DCodes.length + " 注.";
            }).catch(function(error){
                console.log("resp:" + JSON.stringify(error, null, 2));
                app.handleException("转换请求失败!");
            });

        },
        killCode: function () {
            if(!this.config.isPredict){
                this.handleException("请先完成预测");
                return;
            }

            var args = {
                "welfareCode": this.welfareCode,
                "sumValue": this.sumValue,
                "boldCode": this.boldCode
            };

            // console.log(JSON.stringify($rootScope.welfareCode, null, 2));
            console.log(JSON.stringify(args, null ,2));
            var count = this.wyfCodes.length;

            axios({
                method:"POST",
                url:"/api/welfare/codes/filter",
                data: JSON.stringify(args),
                headers:{
                    "Content-Type": "application/json; charset=UTF-8"
                }
            }).then(function(response) {
                app.handleThreeCodeResponse(response.data.data);
                app.wyfMessage = "总计 " + count + " 注, 杀码 " + (count - app.welfareCode.w3DCodes.length) + " 注, 余 " + app.welfareCode.w3DCodes.length + " 注.";
            }).catch(function(response) {
                console.log("resp:" + JSON.stringify(response.data, null, 2));
                app.handleException("杀码请求失败!");
            });

        },

        doPermutationFive: function () {
            if(!this.config.isPredict){
                this.handleException("请先完成排三组码");
                return;
            }

            var requestConfig = {
                method: "POST",
                url: "/api/p5/permutation/five",
                data: JSON.stringify(this.welfareCode.w3DCodes),
                headers: {
                    "Content-Type": "application/json; charset=UTF-8"
                }
            };

            console.log("requestConfig:" + JSON.stringify(requestConfig, null, 2));

            axios(requestConfig).then(function (resp) {
                console.log(JSON.stringify(resp));
                app.handleFiveCodeResponse(resp.data.data, "预测");

            }).catch(function (reason) {
                console.log(reason);
            })
        },
        constProcess: function (processorId){
            if(!this.config.isP5){
                this.handleException("请先完成排5");
                return;
            }

            var args = {
                filterType: processorId,
                wCodes: this.welfareCode
            };

            // console.log(JSON.stringify($rootScope.welfareCode, null, 2));
            console.log(JSON.stringify(args, null ,2));
            var count = this.wyfCodes.length;

            axios({
                method:"POST",
                url:"/api/p5/sequence/process",
                data: JSON.stringify(args),
                headers:{
                    "Content-Type": "application/json; charset=UTF-8"
                }
            }).then(function(response) {
                app.handleFiveCodeResponse(response.data.data, "杀码");
                app.wyfMessage = "总计 " + count + " 注, 杀码 " + (count - app.wyfCodes.length) + " 注, 余 " + app.wyfCodes.length + " 注.";
            }).catch(function(reason) {
                console.log(reason);
                app.handleException("杀码请求失败!");
            });
        },

        boldProcess: function (processorId){
            if(!this.config.isP5){
                this.handleException("请先完成排5");
                return;
            }

            var args = {
                filterType: processorId,
                wCodes: this.welfareCode,
                boldCodeFive: this.boldCodeFive
            };

            // console.log(JSON.stringify($rootScope.welfareCode, null, 2));
            console.log(JSON.stringify(args, null ,2));
            var count = this.wyfCodes.length;

            axios({
                method:"POST",
                url:"/api/p5/sequence/process",
                data: JSON.stringify(args),
                headers:{
                    "Content-Type": "application/json; charset=UTF-8"
                }
            }).then(function(response) {
                app.handleFiveCodeResponse(response.data.data, "含X码杀");
                app.wyfMessage = "总计 " + count + " 注, 杀码 " + (count - app.wyfCodes.length) + " 注, 余 " + app.wyfCodes.length + " 注.";
            }).catch(function(reason) {
                console.log(reason);
                app.handleException("杀码请求失败!");
            });
        },
        bitsProcess: function(){
            if(!this.config.isP5){
                this.handleException("请先完成排5");
                return;
            }

            var bitsArray = [];
            bitsArray.push(this.unit);
            bitsArray.push(this.decade);
            bitsArray.push(this.hundred);
            bitsArray.push(this.kilobit);
            bitsArray.push(this.myriabit);

            var args = {
                bits: bitsArray,
                wCodes: this.welfareCode
            };

            // console.log(JSON.stringify($rootScope.welfareCode, null, 2));
            console.log(JSON.stringify(args, null ,2));
            var count = this.wyfCodes.length;

            axios({
                method:"POST",
                url:"/api/p5/bits/process",
                data: JSON.stringify(args),
                headers:{
                    "Content-Type": "application/json; charset=UTF-8"
                }
            }).then(function(response) {
                app.handleFiveCodeResponse(response.data.data, "位杀");
                app.wyfMessage = "总计 " + count + " 注, 杀码 " + (count - app.wyfCodes.length) + " 注, 余 " + app.wyfCodes.length + " 注.";
            }).catch(function(reason) {
                console.log(reason);
                app.handleException("位杀请求失败!");
            });
        },

        handleException: function (msg) {
            alert(msg);
        }
    }
});
