require('dotenv').config();
const TelegramServer = require('telegram-test-api');
const sinon = require("sinon");
const { expect } = require("chai");
const { initialize } = require('../bot');
const { User, Order } = require('../models');
const ordersActions = require('../bot/ordersActions');
const testUser = require('./user');
const testOrder = require('./order');

describe('Telegram bot test', () => {
  const serverConfig = { port: 9001 };
  const token = '123456';
  let server;
  beforeEach(() => {
    server = new TelegramServer(serverConfig);
    return server.start().then(() => {
      // the options passed to Telegraf in this format will make it try to
      // get messages from the server's local URL
      const bot = initialize(token, { telegram: { apiRoot: server.ApiURL } });
      bot.startPolling();
    });
  });

  afterEach(() => server.stop());

  it('should start', async () => {
    const client = server.getClient(token, { timeout: 5000 });
    const command = client.makeCommand('/start');
    const res = await client.sendCommand(command);
    expect(res.ok).to.be.equal(true);
    const updates = await client.getUpdates();
    expect(updates.ok).to.be.equal(true);
    expect(updates.result.length).to.be.equal(1);
  });

  it('should return /sell help', async () => {
    const client = server.getClient(token, { timeout: 5000 });
    // We spy on the User findOne called on ValidateUser()
    const userStub = sinon.stub(User, "findOne");
    // We spy on the Order findOne called on validateSeller()
    const orderStub = sinon.stub(Order, "findOne");
    // We make it to return our data
    userStub.returns(testUser);
    orderStub.returns(false);
    const command = client.makeCommand('/sell');
    const res = await client.sendCommand(command);
    expect(res.ok).to.be.equal(true);
    const updates = await client.getUpdates();
    // We restore the stubs
    userStub.restore();
    orderStub.restore();
    expect(updates.ok).to.be.equal(true);
    expect(updates.result[0].message.text).to.be.equal('/sell <monto_en_sats> <monto_en_fiat> <codigo_fiat> <método_de_pago> [margen_de_precio]');
  });

  it('should create a /sell', async () => {
    const client = server.getClient(token, { timeout: 5000 });
    // We spy on the User findOne called on ValidateUser()
    const userStub = sinon.stub(User, "findOne");
    // We spy on the Order findOne called on validateSeller()
    const orderStub = sinon.stub(Order, "findOne");
    // We spy the createOrder call
    const createOrderStub = sinon.stub(ordersActions, "createOrder");
    // We make it to return our data
    userStub.returns(testUser);
    orderStub.returns(false);
    createOrderStub.returns(testOrder);
    const command = client.makeCommand('/sell 100 1 ves Pagomovil');
    const res = await client.sendCommand(command);
    expect(res.ok).to.be.equal(true);
    const updates = await client.getUpdates();
    // We restore the stubs
    userStub.restore();
    orderStub.restore();
    createOrderStub.restore();
    expect(updates.ok).to.be.equal(true);
    expect(updates.result.length).to.be.equal(5);
    expect(updates.result[0].message.chat_id).to.be.equal(process.env.CHANNEL);
    expect(updates.result[3].message.text).to.be.equal('Puedes cancelar esta orden antes de que alguien la tome ejecutando:');
  });

  it('should return /buy help', async () => {
    const client = server.getClient(token, { timeout: 5000 });
    // We spy on the User findOne called on ValidateUser()
    const userStub = sinon.stub(User, "findOne");
    // We spy on the Order findOne called on validateSeller()
    const orderStub = sinon.stub(Order, "findOne");
    // We make it to return our data
    userStub.returns(testUser);
    orderStub.returns(false);
    const command = client.makeCommand('/buy');
    const res = await client.sendCommand(command);
    expect(res.ok).to.be.equal(true);
    const updates = await client.getUpdates();
    // We restore the stubs
    userStub.restore();
    orderStub.restore();
    expect(updates.ok).to.be.equal(true);
    expect(updates.result[0].message.text).to.be.equal('/buy <monto_en_sats> <monto_en_fiat> <codigo_fiat> <método_de_pago> [margen_de_precio]');
  });
});
