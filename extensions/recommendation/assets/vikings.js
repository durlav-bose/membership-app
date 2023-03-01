let curr;
let discountPercentage;
let discountCode;
let discountAmount;
let allocationMethod;
let currencyCode;
let handles = [];

var getCustomerId = () => {
  if (window.ShopifyAnalytics && window.ShopifyAnalytics.meta.page.customerId) {
    curr = window.ShopifyAnalytics.meta.page.customerId;
    return curr;
  } else if (window.meta.page.customerId) {
    curr = window.meta.page.customerId;
    return curr;
  } else if (__st && __st.cid) {
    curr = __st.cid;
    return curr;
  }
};

let customer = getCustomerId();
if (customer) {
  checkDiscount(customer);
}

async function checkDiscount(userId) {
  const discountInterval = setInterval(() => {
    getDiscountDetails(userId);
    clearInterval(discountInterval);
  }, 100);
}

async function getDiscountDetails(userId) {
  try {
    const siteUrl = window.location.origin;
    console.log("siteUrl..........................", siteUrl);
    const shop = window.Shopify.shop;
    const response = await fetch(
      `/apps/extra/json?userId=${userId}&shop=${shop}`,
      {
        method: "GET",
        headers: new Headers({
          "ngrok-skip-browser-warning": "69420",
          "Content-Type": "application/json",
        }),
      }
    );
    if (response.ok) {
      console.log("discount working...................... really???");
      const data = await response.json();
      console.log("data.....", data);
      discountPercentage = -1 * data.discountPercentage;
      discountCode = data.discountCode;
      discountAmount = parseFloat(data.discountAmount);
      allocationMethod = data.allocationMethod;
      currencyCode = data.currencyCode;
      handles = data.handles;
      if (discountCode && (discountPercentage || discountAmount)) {
        updatedDom();
      }
    }
  } catch (error) {
    console.log("error from getDiscountDetails........................", error);
  }
}

function getString(href, comparedString) {
  let startIndex = window.location.origin + "/products/";
  let endIndex;
  if (href.includes(comparedString)) {
    endIndex = href.indexOf(comparedString);
  } else {
    endIndex = undefined;
  }
  let string = href.slice(startIndex.length, endIndex);
  console.log("string.....", string);
  return string;
}

function getPriceDetails(actualPrice) {
  if (
    actualPrice &&
    actualPrice.innerHTML &&
    actualPrice.innerHTML.includes("$")
  ) {
    let trim = actualPrice.innerHTML
      ? actualPrice.innerHTML.replace(/^\s+|\s+$/gm, "")
      : "";
    let trimmedArray = trim.split(" ");
    let priceAmount =
      trimmedArray[0] && trimmedArray[0].slice(1, trimmedArray[0].length)
        ? trimmedArray[0].slice(1, trimmedArray[0].length)
        : "";
    let currencySign =
      trimmedArray[0] && trimmedArray[0].slice(0, 1)
        ? trimmedArray[0].slice(0, 1)
        : "";
    let currencyName = trimmedArray[1] ? trimmedArray[1] : "";
    return {
      priceAmount,
      currencySign,
      currencyName,
    };
  } else if (
    actualPrice &&
    actualPrice.innerHTML &&
    !actualPrice.innerHTML.includes("$")
  ) {
    let trim = actualPrice.innerHTML
      ? actualPrice.innerHTML.replace(/^\s+|\s+$/gm, "")
      : "";
    let priceAmount = trim;
    return {
      priceAmount,
      currencySign: "$",
      currencyName: "USD",
    };
  }
}

function getPriceAmount(priceAmountInt) {
  if (discountPercentage) {
    return priceAmountInt - priceAmountInt * (discountPercentage / 100);
  } else if (discountAmount && allocationMethod == "EACH") {
    return priceAmountInt + discountAmount;
  } else if (discountAmount && allocationMethod == "ACROSS") {
    return priceAmountInt;
  }
}

function setDomStyle(actualPriceMain, priceContainerMain, updatedPrice) {
  actualPriceMain.style.textDecoration = "line-through";
  actualPriceMain.style.marginRight = "5px";
  priceContainerMain.appendChild(updatedPrice);
  priceContainerMain.style.display = "flex";
  priceContainerMain.style.alignItems = "center";
}

function getFooterDetails(cartFooter, cartFooterDiscount, total) {
  let currencyItems = getPriceDetails(cartFooter);
  let currencySign;
  let currencyName;
  if (
    currencyItems &&
    (currencyItems.currencySign || currencyItems.currencyName)
  ) {
    currencySign = currencyItems.currencySign;
    currencyName = currencyItems.currencyName;
  }
  if (
    (discountPercentage && allocationMethod == "ACROSS") ||
    (discountPercentage && allocationMethod == "EACH") ||
    (discountAmount && allocationMethod == "EACH")
  ) {
    cartFooter &&
      (cartFooter.innerHTML = `${currencySign}${total.toFixed(
        2
      )} ${currencyName}`);
  } else if (
    discountAmount &&
    allocationMethod == "ACROSS" &&
    cartFooterDiscount
  ) {
    let discountAmountDiv = document.createElement("div");
    let discountAmountText = document.createElement("span");
    let addedDiscountAmount = document.createElement("span");
    let subTotalAmountDiv = document.createElement("div");
    let subTotalAmountText = document.createElement("span");
    let subTotatlAmount = document.createElement("span");
    let content = document.createElement("div");
    subTotalAmountText.innerHTML = "Discounted Subtotal";
    subTotalAmountText.style.fontWeight = "bold";
    subTotatlAmount.innerHTML = `${currencySign}${(
      total + discountAmount
    ).toFixed(2)} ${currencyName}`;
    subTotalAmountDiv.append(subTotalAmountText, subTotatlAmount);
    subTotalAmountDiv.style.display = "flex";
    subTotalAmountDiv.style.alignItems = "center";
    subTotalAmountDiv.style.gap = "5px";
    subTotalAmountDiv.style.justifyContent = "space-between";
    discountAmountText.innerHTML = "Discount Amount";
    discountAmountText.style.fontWeight = "bold";
    addedDiscountAmount.innerHTML = `-  ${currencySign}${
      -1 * discountAmount
    } ${currencyName}`;
    discountAmountDiv.append(discountAmountText, addedDiscountAmount);
    discountAmountDiv.style.display = "flex";
    discountAmountDiv.style.alignItems = "center";
    discountAmountDiv.style.gap = "5px";
    discountAmountDiv.style.justifyContent = "space-between";
    cartFooter.innerHTML = `${currencySign} ${total.toFixed(
      2
    )} ${currencyName}`;
    content.append(discountAmountDiv, subTotalAmountDiv);
    cartFooterDiscount.append(content);
  }
}

function setEachCardDom(item, index, actualPrice, priceContainer) {
  const updatedPrice = document.createElement("span");
  let { priceAmount, currencySign, currencyName } =
    getPriceDetails(actualPrice);
  let priceAmountInt = parseFloat(priceAmount);
  if (priceAmountInt) {
    priceAmount = getPriceAmount(priceAmountInt);
  }
  updatedPrice.innerHTML = `${currencySign}${priceAmount.toFixed(
    2
  )} ${currencyName}`;
  setDomStyle(actualPrice, priceContainer, updatedPrice);
}

function specialCardInfo(
  cartProductHref,
  cartItemDetails,
  cartActualPrice,
  oneProductValues,
  quantityInput,
  cartFooter,
  cartFooterDiscount,
  total,
  elementToObserve,
  observer
) {
  cartProductHref.forEach((item, index) => {
    let string;
    if (oneProductValues != false) {
      let comparedString = "?";
      let href = item.href;
      string = getString(href, comparedString);
    } else {
      var str = item.href;
      var n = str.lastIndexOf("/");
      let endIndex;
      if (str.includes("?")) {
        endIndex = str.indexOf("?");
      } else {
        endIndex = undefined;
      }
      string = str.substring(n + 1, endIndex);
    }
    if (cartActualPrice && cartActualPrice.length && cartActualPrice[index]) {
      let priceAmount;
      let currencySign;
      let priceDetails = getPriceDetails(cartActualPrice[index]);
      if (
        priceDetails &&
        priceDetails.currencySign &&
        priceDetails.priceAmount
      ) {
        priceAmount = priceDetails.priceAmount;
        currencySign = priceDetails.currencySign;
      }
      handles.forEach((handle, i) => {
        if (string == handle) {
          const updatedPrice = document.createElement("span");
          let priceAmountInt = parseFloat(priceAmount);
          priceAmount = getPriceAmount(priceAmountInt);
          console.log("priceAmount.....", priceAmount);
          if (
            (discountPercentage && allocationMethod == "ACROSS") ||
            (discountPercentage && allocationMethod == "EACH") ||
            (discountAmount && allocationMethod == "EACH")
          ) {
            updatedPrice.innerHTML = `${currencySign}${priceAmount.toFixed(2)}`;
            cartItemDetails[index].appendChild(updatedPrice);
            cartItemDetails[index].style.display = "flex";
            cartItemDetails[index].style.alignItems = "center";
            cartItemDetails[index].style.justifyContent = "end";
            cartActualPrice[index].style.textDecoration = "line-through";
            cartActualPrice[index].style.fontSize = "14px";
            cartActualPrice[index].style.color = "red";
            cartActualPrice[index].style.marginRight = "5px";
          }
        }
      });

      if (
        (discountPercentage && allocationMethod == "ACROSS") ||
        (discountPercentage && allocationMethod == "EACH") ||
        (discountAmount && allocationMethod == "EACH")
      ) {
        if (oneProductValues != false) {
          oneProductValues[index].innerHTML = `${currencySign}${(
            parseFloat(priceAmount) *
            parseInt(quantityInput[index].attributes.value.nodeValue)
          ).toFixed(2)}`;
        }
        total =
          total +
          parseFloat(priceAmount) *
            parseInt(quantityInput[index].attributes.value.nodeValue);
      } else if (discountAmount && allocationMethod == "ACROSS") {
        total =
          total +
          parseFloat(priceAmount) *
            parseInt(quantityInput[index].attributes.value.nodeValue);
      }
    }
    if (elementToObserve) {
      console.log("observer.....specialCardInfo.....", observer);
      requestIdleCallback(() => {
        observer.observe(elementToObserve, { childList: true, subtree: true });
      });
      observer.disconnect();
    }
  });
  if (cartFooter) {
    console.log("cartFooter inside specialCardInfo.....", cartFooter);
    getFooterDetails(cartFooter, cartFooterDiscount, total);
  }
}

function mySearch(searchResultHref, searchResultPriceDiv, searchResultPrice) {
  if (searchResultHref && searchResultHref.length) {
    searchResultHref.forEach((item, index) => {
      if (searchResultPrice[index] && searchResultPrice[index].innerHTML) {
        let { priceAmount, currencySign } = getPriceDetails(
          searchResultPrice[index]
        );
        var str = item.href;
        var n = str.lastIndexOf("/");
        let endIndex;
        if (str.includes("?")) {
          endIndex = str.indexOf("?");
        } else {
          endIndex = undefined;
        }
        string = str.substring(n + 1, endIndex);
        console.log("string string string ", string);
        handles.forEach((handle, i) => {
          if (string == handle) {
            const updatedPrice = document.createElement("span");
            console.log("updatedPrice.....", updatedPrice);
            let priceAmountInt = parseFloat(priceAmount);
            priceAmount = getPriceAmount(priceAmountInt);
            if (
              (discountPercentage && allocationMethod == "ACROSS") ||
              (discountPercentage && allocationMethod == "EACH") ||
              (discountAmount && allocationMethod == "EACH")
            ) {
              updatedPrice.innerHTML = `${currencySign}${priceAmount}`;
              updatedPrice.classList.add("mod-price");
              if (
                searchResultPriceDiv[index].children &&
                searchResultPriceDiv[index].children.length <= 2
              ) {
                searchResultPriceDiv[index].appendChild(updatedPrice);
                searchResultPriceDiv[index].style.display = "flex";
                searchResultPriceDiv[index].style.alignItems = "center";
                searchResultPriceDiv[index].style.justifyContent = "start";
                searchResultPrice[index].style.textDecoration = "line-through";
                searchResultPrice[index].style.marginRight = "5px";
              }
            }
          }
        });
      }
    });
  }
}

function updatedDom() {
  if (discountCode) {
    document.cookie = `discount_code=${discountCode}`;
  }
  if (window.location.pathname == "/") {
    let productTitle = document.querySelectorAll(
      ".grid.grid--uniform.grid--view-items .grid-view-item__link.grid-view-item__image-container"
    );
    let priceContainer = document.querySelectorAll(
      ".grid.grid--uniform.grid--view-items .price.price--listing .price__regular"
    );
    let actualPrice = document.querySelectorAll(".grid.grid--uniform.grid--view-items .price.price--listing .price__regular .price-item.price-item--regular .money");
    // let actualPrice = document.querySelectorAll(
    //   ".grid.grid--uniform.grid--view-items .price.price--listing .price__regular .price-item.price-item--regular"
    // );

    if (discountPercentage || (discountAmount && allocationMethod == "EACH")) {
      productTitle.forEach((item, index) => {
        var str = item.href;
        var n = str.lastIndexOf("/");
        var string = str.substring(n + 1);
        console.log("string.....", string);
        handles.forEach((handle, i) => {
          if (string == handle) {
            setEachCardDom(
              item,
              index,
              actualPrice[index],
              priceContainer[index]
            );
          }
        });
      });
    }
  } else if (window.location.pathname.includes("/collections/")) {
    let productTitle = document.querySelectorAll(
      ".grid.grid--uniform.grid--view-items .grid-view-item__link.grid-view-item__image-container"
    );
    let priceContainer = document.querySelectorAll(
      ".grid.grid--uniform.grid--view-items .price.price--listing .price__regular"
    );
    let actualPrice = document.querySelectorAll(".grid.grid--uniform.grid--view-items .price.price--listing .price__regular .price-item.price-item--regular .money");
    // let actualPrice = document.querySelectorAll(
    //   ".grid.grid--uniform.grid--view-items .price.price--listing .price__regular .price-item.price-item--regular"
    // );

    if (discountPercentage || (discountAmount && allocationMethod == "EACH")) {
      productTitle.forEach((item, index) => {
        var str = item.href;
        var n = str.lastIndexOf("/");
        var string = str.substring(n + 1);
        console.log("string.....", string);
        handles.forEach((handle, i) => {
          if (string == handle) {
            setEachCardDom(
              item,
              index,
              actualPrice[index],
              priceContainer[index]
            );
          }
        });
      });
    }
  } else if (window.location.pathname.includes("/products/")) {
    let productTitle = document.querySelectorAll(
      ".grid.grid--uniform.grid--view-items .grid-view-item__link.grid-view-item__image-container"
    );
    let priceContainer = document.querySelectorAll(
      ".grid.grid--uniform.grid--view-items .price.price--listing .price__regular"
    );
    let actualPrice = document.querySelectorAll(".grid.grid--uniform.grid--view-items .price.price--listing .price__regular .price-item.price-item--regular .money");
    // let actualPrice = document.querySelectorAll(
    //   ".grid.grid--uniform.grid--view-items .price.price--listing .price__regular .price-item.price-item--regular"
    // );

    if (
      (discountPercentage && allocationMethod == "ACROSS") ||
      (discountPercentage && allocationMethod == "EACH") ||
      (discountAmount && allocationMethod == "EACH")
    ) {
      productTitle.forEach((item, index) => {
        var str = item.href;
        var n = str.lastIndexOf("/");
        let endIndex;
        if (str.includes("?")) {
          endIndex = str.indexOf("?");
        } else {
          endIndex = undefined;
        }
        var string = str.substring(n + 1, endIndex);
        console.log("string.....", string);

        handles.forEach((handle, i) => {
          if (string == handle) {
            setEachCardDom(
              item,
              index,
              actualPrice[index],
              priceContainer[index]
            );
          }
        });
      });
    }

    let gridItemMain = document.querySelectorAll(".grid.product-single");
    let priceContainerMain = document.querySelectorAll(
      ".grid.product-single .product__price .price .price__pricing-group .price__regular"
    );
    let actualPriceMain = document.querySelectorAll(
      ".grid.product-single .product__price .price .price__pricing-group .price__regular .price-item.price-item--regular .money"
    );
    // let actualPriceMain = document.querySelectorAll(
    //   ".grid.product-single .product__price .price .price__pricing-group .price__regular .price-item.price-item--regular"
    // );

    if (discountPercentage || (discountAmount && allocationMethod == "EACH")) {
      var str = window.location.href;
      var n = str.lastIndexOf("/");
      let endIndex;
      if (str.includes("?")) {
        endIndex = str.indexOf("?");
      } else {
        endIndex = undefined;
      }
      string = str.substring(n + 1, endIndex);
      console.log("string.....", string);

      handles.forEach((handle, ind) => {
        if (string == handle) {
          gridItemMain.forEach((item, index) => {
            setEachCardDom(
              item,
              index,
              actualPriceMain[index],
              priceContainerMain[index]
            );
          });
        }
      });
    }
  } else if (window.location.pathname == "/cart") {
    const cartItemDetails = document.querySelectorAll(
      "form.cart table tbody .cart__row .cart__price [data-cart-item-price-list] [data-cart-item-regular-price-group]"
    );
    let cartActualPrice = document.querySelectorAll(
      "form.cart table tbody .cart__row .cart__price [data-cart-item-price-list] [data-cart-item-regular-price-group] [data-cart-item-regular-price] .money"
    );
    // let cartActualPrice = document.querySelectorAll(
    //   "form.cart table tbody .cart__row .cart__price [data-cart-item-price-list] [data-cart-item-regular-price-group] [data-cart-item-regular-price]"
    // );
    let quantityInput = document.querySelectorAll(
      "form.cart table tbody .cart__row .cart__quantity-td .cart__qty input.cart__qty-input"
    );
    let oneProductValues = document.querySelectorAll(
      "form.cart table tbody .cart__row .cart__final-price [data-cart-item-regular-price-group] [data-cart-item-regular-price] .money"
    );
    // let oneProductValues = document.querySelectorAll(
    //   "form.cart table tbody .cart__row .cart__final-price [data-cart-item-regular-price-group] [data-cart-item-regular-price]"
    // );
    let cartProductHref = document.querySelectorAll(
      "form.cart table tbody .cart__row .cart__meta .cart__product-information .list-view-item__title .cart__product-title"
    );
    let cartFooter = document.querySelector(
      "form.cart .cart__footer .grid__item .cart-subtotal .cart-subtotal__price .money"
    );
    // let cartFooter = document.querySelector(
    //   "form.cart .cart__footer .grid__item .cart-subtotal .cart-subtotal__price"
    // );
    let cartFooterDiscount = document.querySelector(
      "form.cart .cart__footer .grid__item .cart-subtotal"
    );
    let total = 0;
    specialCardInfo(
      cartProductHref,
      cartItemDetails,
      cartActualPrice,
      oneProductValues,
      quantityInput,
      cartFooter,
      cartFooterDiscount,
      total
    );
    let elementToObserve = document.querySelector("form.cart");
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation, index) => {
        console.log("index ................................ ", index);
        if (index == 0) {
          let cartItems = document.querySelectorAll(
            "form.cart table tbody .cart__row"
          );
          const cartItemDetails = document.querySelectorAll(
            "form.cart table tbody .cart__row .cart__price [data-cart-item-price-list] [data-cart-item-regular-price-group]"
          );
          let cartActualPrice = document.querySelectorAll(
            "form.cart table tbody .cart__row .cart__price [data-cart-item-price-list] [data-cart-item-regular-price-group] [data-cart-item-regular-price] .money"
          );
          // let cartActualPrice = document.querySelectorAll(
          //   "form.cart table tbody .cart__row .cart__price [data-cart-item-price-list] [data-cart-item-regular-price-group] [data-cart-item-regular-price]"
          // );
          let quantityInput = document.querySelectorAll(
            "form.cart table tbody .cart__row .cart__quantity-td .cart__qty input.cart__qty-input"
          );
          let oneProductValues = document.querySelectorAll(
            "form.cart table tbody .cart__row .cart__final-price [data-cart-item-regular-price-group] [data-cart-item-regular-price] .money"
          );
          // let oneProductValues = document.querySelectorAll(
          //   "form.cart table tbody .cart__row .cart__final-price [data-cart-item-regular-price-group] [data-cart-item-regular-price]"
          // );
          let cartProductHref = document.querySelectorAll(
            "form.cart table tbody .cart__row .cart__meta .cart__product-information .list-view-item__title .cart__product-title"
          );
          let cartFooter = document.querySelector(
            "form.cart .cart__footer .grid__item .cart-subtotal .cart-subtotal__price .money"
          );
          // let cartFooter = document.querySelector(
          //   "form.cart .cart__footer .grid__item .cart-subtotal .cart-subtotal__price"
          // );
          let cartFooterDiscount = document.querySelector(
            "form.cart .cart__footer .grid__item .cart-subtotal"
          );

          fetch(window.Shopify.routes.root + `cart.js`)
            .then((res) => res.json())
            .then((data) => {
              if (data && data.items && data.items.length) {
                console.log("data.items", data.items);
              }

              let total = 0;
              cartProductHref.forEach((item, index) => {
                if (
                  cartActualPrice &&
                  cartActualPrice.length &&
                  cartActualPrice[index]
                ) {
                  let { priceAmount, currencySign, currencyName } =
                    getPriceDetails(cartActualPrice[index]);
                  let comparedString = "?variant";
                  let href = item.href;
                  let string = getString(href, comparedString);

                  handles.forEach((handle, i) => {
                    if (string == handle) {
                      const updatedPrice = document.createElement("span");
                      let priceAmountInt = parseFloat(priceAmount);
                      priceAmount = getPriceAmount(priceAmountInt);
                      if (
                        discountPercentage ||
                        (discountAmount && allocationMethod == "EACH")
                      ) {
                        updatedPrice.innerHTML = `${currencySign}${priceAmount}`;
                        cartItemDetails[index].appendChild(updatedPrice);
                        cartItemDetails[index].style.display = "flex";
                        cartItemDetails[index].style.justifyContent = "end";
                        cartItemDetails[index].style.alignItems = "center";
                        cartActualPrice[index].style.textDecoration =
                          "line-through";
                        cartActualPrice[index].style.color = "red";
                        cartActualPrice[index].style.marginRight = "7px";
                      }
                    }
                  });

                  if (
                    discountPercentage ||
                    (discountAmount && allocationMethod == "EACH")
                  ) {
                    oneProductValues[index].innerHTML = `${currencySign}${(
                      parseFloat(priceAmount) * data.items[index].quantity
                    ).toFixed(2)}`;
                    total =
                      total +
                      parseFloat(priceAmount) * data.items[index].quantity;
                  } else if (discountAmount && allocationMethod == "ACROSS") {
                    total =
                      total +
                      parseFloat(priceAmount) * data.items[index].quantity;
                  }
                }
              });
              getFooterDetails(cartFooter, cartFooterDiscount, total);
              requestIdleCallback(() => {
                observer.observe(elementToObserve, {
                  childList: true,
                  subtree: true,
                });
              });
              observer.disconnect();
            });
        }
      });
    });
    // configure the observer to observe changes to the element's innerHTML
    observer.observe(elementToObserve, {
      childList: true,
      subtree: true,
    });
  } else if (window.location.pathname == "/search") {
    console.log("search.....");
    let searchPageItems = document.querySelectorAll(
      ".product-list.product-list--search .product_row"
    );
    let searchPageItemsHref = document.querySelectorAll(
      ".list-view-items .list-view-item .product-card.product-card--list .full-width-link"
    );
    let searchItemsPriceDiv = document.querySelectorAll(
      ".list-view-items .list-view-item .product-card.product-card--list .list-view-item__link .list-view-item__price-column .price.price--listing .price__regular"
    );
    let searchItemsPrice = document.querySelectorAll(
      ".list-view-items .list-view-item .product-card.product-card--list .list-view-item__link .list-view-item__price-column .price.price--listing .price__regular .price-item.price-item--regular .money"
    );
    // let searchItemsPrice = document.querySelectorAll(
    //   ".list-view-items .list-view-item .product-card.product-card--list .list-view-item__link .list-view-item__price-column .price.price--listing .price__regular .price-item.price-item--regular"
    // );

    if (discountPercentage || (discountAmount && allocationMethod == "EACH")) {
      searchPageItemsHref.forEach((item, index) => {
        var str = item.href;
        var n = str.lastIndexOf("/");
        let endIndex;
        if (str.includes("?")) {
          endIndex = str.indexOf("?");
        } else {
          endIndex = undefined;
        }
        var string = str.substring(n + 1, endIndex);
        console.log("string.....", string);
        handles.forEach((handle, i) => {
          if (string == handle) {
            setEachCardDom(
              item,
              index,
              searchItemsPrice[index],
              searchItemsPriceDiv[index]
            );
          }
        });
      });
    }

    let searchInput = document.querySelectorAll(
      ".search-form.search-page-form .input-group__field input.search-form__input"
    );
    searchInput.forEach((item, index) => {
      item.addEventListener("keydown", async (e) => {
        console.log("e.target.value...................", e.target.value);
        const myInterval = setInterval(() => {
          let searchResultLi = document.querySelectorAll(
            ".predictive-search .predictive-search__list .predictive-search-item"
          );
          let searchResultHref = document.querySelectorAll(
            ".predictive-search .predictive-search__list .predictive-search-item .predictive-search-item__link"
          );
          let searchResultPriceDiv = document.querySelectorAll(
            ".predictive-search .predictive-search__list .predictive-search-item .predictive-search-item__link .predictive-search__column.predictive-search__column--content .predictive-search-item__details.price .price__pricing-group .price__regular"
          );
          let searchResultPrice = document.querySelectorAll(
            ".predictive-search .predictive-search__list .predictive-search-item .predictive-search-item__link .predictive-search__column.predictive-search__column--content .predictive-search-item__details.price .price__pricing-group .price__regular .predictive-search-item__price .money"
          );
          // let searchResultPrice = document.querySelectorAll(
          //   ".predictive-search .predictive-search__list .predictive-search-item .predictive-search-item__link .predictive-search__column.predictive-search__column--content .predictive-search-item__details.price .price__pricing-group .price__regular .predictive-search-item__price"
          // );
          if (searchResultLi && searchResultLi.length) {
            mySearch(searchResultHref, searchResultPriceDiv, searchResultPrice);
          }
          clearInterval(myInterval);
        }, 3000);
      });
      item.addEventListener("focus", (e) => {
        console.log("eeeeeeeeeeeeeeeeeeeeeeeee", e.target.value);
        const myInterval = setInterval(() => {
          let searchResultLi = document.querySelectorAll(
            ".predictive-search .predictive-search__list .predictive-search-item"
          );
          let searchResultHref = document.querySelectorAll(
            ".predictive-search .predictive-search__list .predictive-search-item .predictive-search-item__link"
          );
          let searchResultPriceDiv = document.querySelectorAll(
            ".predictive-search .predictive-search__list .predictive-search-item .predictive-search-item__link .predictive-search__column.predictive-search__column--content .predictive-search-item__details.price .price__pricing-group .price__regular"
          );
          let searchResultPrice = document.querySelectorAll(
            ".predictive-search .predictive-search__list .predictive-search-item .predictive-search-item__link .predictive-search__column.predictive-search__column--content .predictive-search-item__details.price .price__pricing-group .price__regular .predictive-search-item__price .money"
          );
          // let searchResultPrice = document.querySelectorAll(
          //   ".predictive-search .predictive-search__list .predictive-search-item .predictive-search-item__link .predictive-search__column.predictive-search__column--content .predictive-search-item__details.price .price__pricing-group .price__regular .predictive-search-item__price"
          // );
          if (searchResultLi && searchResultLi.length) {
            mySearch(searchResultHref, searchResultPriceDiv, searchResultPrice);
          }
          clearInterval(myInterval);
        }, 3000);
      });
    });
  }

  let searchInput = document.querySelectorAll(
    ".search-form.search-bar__form .search-form__input-wrapper .search-form__input.search-bar__input"
  );
  console.log(
    "searchInput searchInput searchInput searchInput searchInput  ",
    searchInput
  );
  searchInput.forEach((item, index) => {
    item.addEventListener("keydown", async (e) => {
      const myInterval = setInterval(() => {
        let searchResultLi = document.querySelectorAll(
          ".predictive-search .predictive-search__list .predictive-search-item"
        );
        let searchResultHref = document.querySelectorAll(
          ".predictive-search .predictive-search__list .predictive-search-item .predictive-search-item__link"
        );
        let searchResultPriceDiv = document.querySelectorAll(
          ".predictive-search .predictive-search__list .predictive-search-item .predictive-search-item__link .predictive-search__column.predictive-search__column--content .predictive-search-item__details.price .price__pricing-group .price__regular"
        );
        let searchResultPrice = document.querySelectorAll(
          ".predictive-search .predictive-search__list .predictive-search-item .predictive-search-item__link .predictive-search__column.predictive-search__column--content .predictive-search-item__details.price .price__pricing-group .price__regular .predictive-search-item__price .money"
        );
        // let searchResultPrice = document.querySelectorAll(
        //   ".predictive-search .predictive-search__list .predictive-search-item .predictive-search-item__link .predictive-search__column.predictive-search__column--content .predictive-search-item__details.price .price__pricing-group .price__regular .predictive-search-item__price"
        // );
        if (searchResultLi && searchResultLi.length) {
          mySearch(searchResultHref, searchResultPriceDiv, searchResultPrice);
        }
        clearInterval(myInterval);
      }, 2000);
    });

    item.addEventListener("focus", async (e) => {
      const myInterval = setInterval(() => {
        let searchResultLi = document.querySelectorAll(
          ".predictive-search .predictive-search__list .predictive-search-item"
        );
        let searchResultHref = document.querySelectorAll(
          ".predictive-search .predictive-search__list .predictive-search-item .predictive-search-item__link"
        );
        let searchResultPriceDiv = document.querySelectorAll(
          ".predictive-search .predictive-search__list .predictive-search-item .predictive-search-item__link .predictive-search__column.predictive-search__column--content .predictive-search-item__details.price .price__pricing-group .price__regular"
        );
        let searchResultPrice = document.querySelectorAll(
          ".predictive-search .predictive-search__list .predictive-search-item .predictive-search-item__link .predictive-search__column.predictive-search__column--content .predictive-search-item__details.price .price__pricing-group .price__regular .predictive-search-item__price .money"
        );
        // let searchResultPrice = document.querySelectorAll(
        //   ".predictive-search .predictive-search__list .predictive-search-item .predictive-search-item__link .predictive-search__column.predictive-search__column--content .predictive-search-item__details.price .price__pricing-group .price__regular .predictive-search-item__price"
        // );
        if (searchResultLi && searchResultLi.length) {
          mySearch(searchResultHref, searchResultPriceDiv, searchResultPrice);
        }
        clearInterval(myInterval);
      }, 2000);
    });
  });
}
