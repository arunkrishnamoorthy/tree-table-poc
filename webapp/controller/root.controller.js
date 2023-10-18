sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller,Filter,FilterOperator) {
        "use strict";

        return Controller.extend("com.poc.treetablepoc.controller.root", {
            onInit: function () {
                // this.getSalesOrderData();
                this.getRouter()
                    .getRoute("Routeroot")
                    .attachPatternMatched(this._handlePatternMatched, this);
            },


            getRouter: function () {
                return sap.ui.core.UIComponent.getRouterFor(this);
            },

            _handlePatternMatched: function () {

                this.getSalesOrderData().then((data) => {
                    this.formatDataToJSONModel(data);
                })
            },

            formatDataToJSONModel: function (data) {
                let model = this.getView().getModel("treetable");
                let nodeData = {};
                data.forEach((order) => {
                    nodeData.ordernumber = order.Vbeln;
                    nodeData.status = order.status,
                        nodeData.position = "",
                        nodeData.material = "",
                        nodeData.validfrom = order.valid_from,
                        nodeData.validto = order.valid_to,
                        nodeData.netvalue = order.net_value,
                        nodeData.currency = order.currency,
                        nodeData.quantity = "",
                        nodeData.deliveryqty = "",
                        nodeData.type = "order",
                        nodeData.nodes = order._items.map((item) => {
                            return {
                                "ordernumber": item.Vbeln,
                                "status": "",
                                "position": item.Posnr,
                                "material": item.Matnr,
                                "validfrom": null,
                                "validto": null,
                                "netvalue": item.NetValue,
                                "currency": item.Currency,
                                "quantity": item.Quantity,
                                "deliveryqty": item.DelQuan,
                                "type": "item"
                            }
                        })
                });
                let treeData = {
                    "orders": {
                        "nodes": nodeData
                    }
                }
                model.setData(treeData);
            },

            getSalesOrderData: function () {
                let promise = new Promise((resolve, reject) => {
                    let model = this.getView().getModel();
                    let listBinding = this.getOrderBinding();
                    var aFilter = [ new Filter("Vbeln", FilterOperator.EQ, '12345')];
                    listBinding.filter(aFilter);
                    listBinding.getContexts(0, 100);
                    listBinding.attachEventOnce("dataReceived", oEvent => {
                        const aContexts = listBinding.getContexts();
                        const aOrderData = aContexts.map(oContext => oContext.getObject());
                        resolve(aOrderData);
                    });
                });
                return promise;
            },

            handleApprove: function () {
                let status = "Approve";
                this.executeUpdate(status);
            },

            handleReject: function () {
                let status = "Reject";
                this.executeUpdate(status);
            },

            executeUpdate: function (sStatus) {
                let treemodel = this.getView().getModel("treetable");
                let treeData = treemodel.getData();
                debugger;
                // update header. 
                let orderdata = treeData.orders.nodes;
                let sContextPath = `/ZAK_I_SO_HDR('${orderdata.ordernumber}')`;
                let oBinding = this.getView().getModel().bindContext(sContextPath);
                let oContext = oBinding.getBoundContext();
                oContext.requestObject().then(function (oData) {
                    let validFrom = new Date(orderdata.validfrom).toISOString().split("T")[0];
                    let validTo = new Date(orderdata.validto).toISOString().split("T")[0];
                    oContext.setProperty("valid_from", validFrom); 
                    oContext.setProperty("valid_to", validTo);
                    oContext.setProperty("status", sStatus);
                });
                // update items
                for( let item of orderdata.nodes) {
                    let sItemContextPath = `/ZAK_I_SO_ITM(Vbeln='${item.ordernumber}',Posnr='${item.position}')`;
                    let oItemBinding = this.getView().getModel().bindContext(sItemContextPath);
                    let oItemContext = oItemBinding.getBoundContext();
                    oItemContext.requestObject().then(function (oData) {
                        oItemContext.setProperty("DelQuan", item.deliveryqty); 
                    });
                }
                oBinding.attachEventOnce("patchCompleted", (oEvent) => {
                    var bSuccess = oEvent.getParameter("success");
                    if (bSuccess) {
                        sap.m.MessageToast.show("Data updated sucessfully");
                    }
                });
            },

            handleCreateDummyData: function () {
                this.getOrderBinding().create({
                    Vbeln: "12345",
                    Vbeln: "InApproval",
                    valid_from: null,
                    valid_to: null,
                    net_value: "500",
                    currency: "USD"
                });
                this.getItemBinding().create({
                    Vbeln: "12345",
                    Posnr: "10",
                    Matnr: "ABC",
                    NetValue: "320",
                    Currency: "USD",
                    Quantity: "50",
                    DelQuan: "50",
                    Uom: "PC"
                });
                this.getItemBinding().create({
                    Vbeln: "12345",
                    Posnr: "20",
                    Matnr: "DEF",
                    NetValue: "180",
                    Currency: "USD",
                    Quantity: "50",
                    DelQuan: "50",
                    Uom: "PC"
                });
            },

            getOrderBinding: function () {
                let model = this.getView().getModel();
                this.orderBinding = model.bindList(
                    "/ZAK_I_SO_HDR",
                    null,
                    /** Sorters */[],
                    /**Filters */[],
                    {
                        $expand: "_items",
                        $$updateGroupId: "SalesOrder",
                    }
                );
                return this.orderBinding;
            },

            getItemBinding: function () {
                let model = this.getView().getModel();
                this.orderItemBinding = model.bindList(
                    "/ZAK_I_SO_ITM",
                    null,
                    [],
                    []
                );
                return this.orderItemBinding;
            }


        });
    });
