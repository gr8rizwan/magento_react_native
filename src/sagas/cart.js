import { takeLatest, takeEvery, call, put } from 'redux-saga/effects';
import { magento } from '../magento';
import { MAGENTO } from '../actions/actionsTypes';
import { extractErrorMessage } from '../utils';

const createQuoteId = function* createQuoteId() {
  try {
    yield put({ type: MAGENTO.CREATE_QUOTE_ID_LOADING });
    const quoteId = yield call({ content: magento, fn: magento.customer.createQuoteId });
    yield put({ type: MAGENTO.CREATE_QUOTE_ID_SUCCESS, payload: { quoteId } });
    yield put({ type: MAGENTO.CUSTOMER_CART_REQUEST });
  } catch (error) {
    yield put({ type: MAGENTO.CREATE_QUOTE_ID_FAILURE, payload: { errorMessage: extractErrorMessage(error) } });
  }
};

// FIXME: Potential infinite loop, cart error => calls create quote => create quote calls again this function
const getCustomerCart = function* fetchCustomerCart() {
  try {
    yield put({ type: MAGENTO.CUSTOMER_CART_LOADING });
    const cart = yield call({ content: magento, fn: magento.customer.getCustomerCart });
    yield put({ type: MAGENTO.CUSTOMER_CART_SUCCESS, payload: { cart } });
  } catch (error) {
    yield put({ type: MAGENTO.CUSTOMER_CART_FAILURE, payload: { errorMessage: extractErrorMessage(error) } });
    if (error.message === 'No such entity with %fieldName = %fieldValue') {
      yield put({ type: MAGENTO.CREATE_QUOTE_ID_REQUEST });
    }
  }
};

const getCartItemProduct = function* fetchCartItemProduct(action) {
  try {
    const payload = yield call({ content: magento, fn: magento.admin.getProductBySku }, action.payload);
    yield put({ type: MAGENTO.CART_ITEM_PRODUCT_SUCCESS, payload });
  } catch (error) {
    yield put({ type: MAGENTO.CART_ITEM_PRODUCT_FAILURE, payload: extractErrorMessage(error) });
  }
};

const removeItemFromCart = function* deleteItemFromCart({ payload }) {
  try {
    yield put({ type: MAGENTO.REMOVE_ITEM_FROM_CART_LOADING });
    const isSuccessfullyRemoved = yield call({ content: magento, fn: magento.customer.removeItemFromCart }, payload.itemId);
    yield put({ type: MAGENTO.REMOVE_ITEM_FROM_CART_SUCCESS, payload: { isSuccessfullyRemoved } });
    yield put({ type: MAGENTO.CUSTOMER_CART_REQUEST }); // Refetch the cart
  } catch (error) {
    yield put({ type: MAGENTO.REMOVE_ITEM_FROM_CART_FAILURE, payload: extractErrorMessage(error) });
  }
};

const cartSagas = [
  takeLatest(MAGENTO.CREATE_QUOTE_ID_REQUEST, createQuoteId),
  takeLatest(MAGENTO.CUSTOMER_CART_REQUEST, getCustomerCart),
  takeEvery(MAGENTO.CART_ITEM_PRODUCT_REQUEST, getCartItemProduct),
  takeEvery(MAGENTO.REMOVE_ITEM_FROM_CART_REQUEST, removeItemFromCart),
];

export default cartSagas;
