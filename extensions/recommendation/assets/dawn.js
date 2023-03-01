let curr;
let discountPercentage;
let discountCode;
let discountAmount;
let allocationMethod;
let handles= [];
let host = window.location.host;

console.log("host.....", host);

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

  // else if (ShopifyAnalytics.lib.user().traits().uniqToken) {
  //   curr = ShopifyAnalytics.lib.user().traits().uniqToken;
  //   return curr;
  // }
};

let customer = getCustomerId();
if(customer) {
  checkDiscount(customer);
}

function checkDiscount(userId) {
  console.log("inside function run.....", userId);
  var xhr = new XMLHttpRequest();
  const siteUrl = window.location.origin;
  console.log("siteUrl.....", siteUrl);
  var url = `${siteUrl}/apps/extra/json?userId=${userId}&host=${host}`;
  xhr.open("GET", url, true);
  xhr.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      let data = JSON.parse(this.responseText);
      if(data) {
        console.log("data.....", data);
        discountPercentage = (-1)*data.discountPercentage;
        discountCode = data.discountCode;
        discountAmount = parseFloat(data.discountAmount);
        allocationMethod = data.allocationMethod;
        handles = data.handles;
        console.log("discountPercentage.....", discountPercentage);
        console.log("discountPercentage.....type.....", typeof(discountPercentage));
        console.log("discountCode.....", discountCode);
        console.log("discountAmount.....", discountAmount);
        console.log("discountAmount.....", discountAmount);
        console.log("allocationMethod.....", allocationMethod);
        console.log("handles.....", handles);
        if(discountCode && (discountPercentage || discountAmount)) {
          updatedCustomer();
        }
      } 
    }
  }
  // Sending our request 
  xhr.send();
}

function getString(href, comparedString) {
  let startIndex = window.location.origin + "/products/";
  let endIndex;
  if(href.includes(comparedString)) {
    endIndex = href.indexOf(comparedString);
  } else {
    endIndex = undefined;
  }
  console.log("endIndex...single product..", endIndex);
  let string = href.slice(startIndex.length, endIndex);
  console.log("string.....", string);
  return string;
}

function getPriceDetails(actualPrice) {
  console.log("actualPrice.....inside.....", actualPrice);
  if (actualPrice) {
    let trim = actualPrice.innerHTML.replace(/^\s+|\s+$/gm, "");
    let trimmedArray = trim.split(" ");
    let priceAmount = trimmedArray[0].slice(1,trimmedArray[0].length);
    let currencySign = trimmedArray[0].slice(0,1);
    let currencyName = trimmedArray[1];
    console.log("priceAmount...inside", priceAmount);
    console.log("currencySign...inside", currencySign);
    console.log("currencyName...inside", currencyName);
    return {
      priceAmount,
      currencySign,
      currencyName
    }
  }
}

function getPriceAmount(priceAmountInt) {
  if(discountPercentage) {
    return priceAmountInt - priceAmountInt * (discountPercentage / 100);
  } else if (discountAmount && allocationMethod == "EACH") {
    return priceAmountInt + discountAmount;
  } else if (discountAmount && allocationMethod == "ACROSS") {
    return priceAmountInt
  }
}

function setDomStyle(actualPriceMain, priceContainerMain, updatedPrice) {
  console.log("actualPriceMain.....", actualPriceMain);
  console.log("priceContainerMain.....", priceContainerMain);
  console.log("updatedPrice.....", updatedPrice);
  actualPriceMain.style.textDecoration = "line-through";
  priceContainerMain.appendChild(updatedPrice);
  priceContainerMain.style.display = "flex";
  priceContainerMain.style.justifyContent = "space-between";
  priceContainerMain.style.alignItems = "center";
}

function getFooterDetails(cartFooter, cartFooterDiscount, total) {
  let { currencySign, currencyName } = getPriceDetails(cartFooter);
  if ((discountPercentage && allocationMethod == "ACROSS") || (discountAmount && allocationMethod == "EACH")) {
    cartFooter.innerHTML = `${currencySign}${total.toFixed(2)} ${currencyName}`;
  } else if (discountAmount && allocationMethod == "ACROSS" && cartFooterDiscount) {
    let discountAmountDiv = document.createElement("div");
    let discountAmountText = document.createElement("span");
    let addedDiscountAmount = document.createElement("span");
    let subTotalAmountDiv = document.createElement("div");
    let subTotalAmountText = document.createElement("span");
    let subTotatlAmount = document.createElement("span");
    let content = document.createElement("div");
    subTotalAmountText.innerHTML = "Discounted Subtotal";
    subTotalAmountText.style.fontWeight = "bold";
    subTotatlAmount.innerHTML = `${currencySign}${(total+discountAmount).toFixed(2)} ${currencyName}`;
    subTotalAmountDiv.append(subTotalAmountText, subTotatlAmount);
    subTotalAmountDiv.style.display = "flex";
    subTotalAmountDiv.style.alignItems = "center";
    subTotalAmountDiv.style.gap = "20px";
    subTotalAmountDiv.style.justifyContent = "end";
    discountAmountText.innerHTML = "Discount Amount";
    discountAmountText.style.fontWeight = "bold";
    addedDiscountAmount.innerHTML = `-  ${currencySign}${(-1)*discountAmount} ${currencyName}`;
    discountAmountDiv.append(discountAmountText, addedDiscountAmount);
    discountAmountDiv.style.display = "flex";
    discountAmountDiv.style.alignItems = "center";
    discountAmountDiv.style.gap = "20px";
    discountAmountDiv.style.justifyContent = "end";
    cartFooter.innerHTML = `${currencySign} ${(total).toFixed(2)} ${currencyName}`;
    content.append(discountAmountDiv, subTotalAmountDiv);
    cartFooterDiscount.insertBefore(content, cartFooterDiscount.children[1]);
  }
}

function setEachCardDom(item,index,actualPrice,priceContainer) {
  console.log("item.....", item);
  console.log("index.....", index);
  const updatedPrice = document.createElement("span");
  console.log("actualPrice.....setEachCardDom", actualPrice);
  let { priceAmount, currencySign, currencyName } = getPriceDetails(actualPrice);
  let priceAmountInt = parseFloat(priceAmount);
  priceAmount = getPriceAmount(priceAmountInt);
  console.log("number.....", priceAmount);
  updatedPrice.innerHTML = `${currencySign}${priceAmount} ${currencyName}`;
  setDomStyle(actualPrice,priceContainer, updatedPrice);
}

function specialCardInfo(cartProductHref, cartItemDetails, cartActualPrice, oneProductValues, quantityInput, cartFooter, cartFooterDiscount, total, elementToObserve, observer) {
  console.log("cartProductHref.....", cartProductHref);
  cartProductHref.forEach((item,index) => {
    let comparedString = "?";
    let href = item.href;
    let string =  getString(href, comparedString);
    if (cartActualPrice && cartActualPrice.length && cartActualPrice[index]) {
      let { priceAmount, currencySign, currencyName } = getPriceDetails(cartActualPrice[index]);
      handles.forEach((handle,i) => {
        if(string == handle) {
          const updatedPrice = document.createElement("span");
          let priceAmountInt = parseFloat(priceAmount);
          priceAmount = getPriceAmount(priceAmountInt);
          console.log("priceAmount.....", priceAmount)
          if((discountPercentage && allocationMethod == "ACROSS") || (discountAmount && allocationMethod == "EACH")) {
            updatedPrice.innerHTML = `${currencySign}${priceAmount}`;
            cartItemDetails[index].appendChild(updatedPrice);
            cartActualPrice[index].style.textDecoration = "line-through";
          }
        } 
      })
      
      if((discountPercentage && allocationMethod == "ACROSS") || (discountAmount && allocationMethod == "EACH")) {
        oneProductValues[index].innerHTML = `${currencySign}${(parseFloat(priceAmount)*parseInt(quantityInput[index].attributes.value.nodeValue)).toFixed(2)}`;
        total = total + parseFloat(priceAmount) * parseInt(quantityInput[index].attributes.value.nodeValue);
      } else if (discountAmount && allocationMethod == "ACROSS") {
        total = total + parseFloat(priceAmount) * parseInt(quantityInput[index].attributes.value.nodeValue);
      }
    }
    if(elementToObserve) {
      console.log("observer.....specialCardInfo.....", observer);
      requestIdleCallback(() => {
        observer.observe(elementToObserve, { childList: true, subtree: true });
      });
      observer.disconnect();
    }  
  })
  if(cartFooter) {
    getFooterDetails(cartFooter, cartFooterDiscount, total);
  }
}

function updatedCustomer() {
  if (customer && window.location.pathname.includes("/products")) {
    let gridItemMain = document.querySelectorAll(
      ".product.product--large .product__info-wrapper.grid__item"
    );
    let priceContainerMain = document.querySelectorAll(".product__info-wrapper.grid__item .price .price__container");
    let actualPriceMain = document.querySelectorAll(
      ".product__info-wrapper.grid__item .price .price__container .price__regular .price-item.price-item--regular"
    );

    if((discountPercentage && allocationMethod == "ACROSS") || (discountAmount && allocationMethod == "EACH")) {
      let comparedString = "?";
      let href = window.location.href;
      let string =  getString(href, comparedString);

      handles.forEach((handle,ind) => {
        if(string == handle) {
          gridItemMain.forEach((item, index) => {
            setEachCardDom(item,index,actualPriceMain[index], priceContainerMain[index]);
          });
        }
      })
    }

    const myInterval = setInterval(() => {
      myProducts();
      console.log("inside my intervmcmmcmcmal..........")
    }, 1000)

    function myProducts() {
      let gridItem = document.querySelectorAll(
        ".grid.product-grid .grid__item"
      );
      let priceContainer = document.querySelectorAll(".grid.product-grid .grid__item .price .price__container");
      let actualPrice = document.querySelectorAll(
        ".grid.product-grid .grid__item .price .price__container .price__regular .price-item.price-item--regular"
      );
      let productTitle = document.querySelectorAll(".grid.product-grid .grid__item .card__inner .card__content .card__information .card__heading .full-unstyled-link");
      console.log("productTitle.....", productTitle);

      if((discountPercentage && allocationMethod == "ACROSS") || (discountAmount && allocationMethod == "EACH")) { 
        productTitle.forEach((item,index) => {
          let comparedString = "?";
          let href = item.href;
          let string =  getString(href, comparedString);
          handles.forEach((handle,i) => {
            if(string == handle) {
              setEachCardDom(item,index,actualPrice[index], priceContainer[index]);
            }
          })
        })
      }

      if(productTitle && productTitle.length) {
        clearInterval(myInterval);
        console.log("clear Interval.....")
      }
    }
  } else if (customer && window.location.pathname !== "/cart") {
    let gridItem = document.querySelectorAll(".product-grid .grid__item");
    let cardInformation = document.querySelectorAll(".card-information");
    let priceContainer = document.querySelectorAll(".price .price__container");
    let actualPrice = document.querySelectorAll(
      ".price .price__container .price__regular .price-item.price-item--regular"
    );
    let productTitle = document.querySelectorAll(".product-grid .grid__item .card__inner .card__content .card__information .card__heading .full-unstyled-link");

    if((discountPercentage && allocationMethod == "ACROSS") || (discountAmount && allocationMethod == "EACH")) { 
      productTitle.forEach((item,index) => {
        let comparedString = "?";
        let href = item.href;
        let string =  getString(href, comparedString);
        handles.forEach((handle,i) => {
          if(string == handle) {
            setEachCardDom(item,index,actualPrice[index], priceContainer[index]);
          }
        })
      })
    }
  } else if (customer && window.location.pathname == "/cart") {
    let gridItem = document.querySelectorAll(".product-grid .grid__item");
    let cardInformation = document.querySelectorAll(".card-information");
    let priceContainer = document.querySelectorAll(".price .price__container");
    let actualPrice = document.querySelectorAll(
      ".price .price__container .price__regular .price-item.price-item--regular"
    );
    let productTitle = document.querySelectorAll(".product-grid .grid__item .card-wrapper .card__inner .card__content .card__information .card__heading .full-unstyled-link");
    
    if((discountPercentage && allocationMethod == "ACROSS") || (discountAmount && allocationMethod == "EACH")) {
      productTitle.forEach((item,index) => {
        let comparedString = "?";
        let href = item.href;
        let string =  getString(href, comparedString);

        handles.forEach((handle,i) => {
          if(string == handle) {
            setEachCardDom(item,index,actualPrice[index], priceContainer[index]);
          }
        })
      })
    }

    
    const cartItemDetails = document.querySelectorAll(
      "form#cart .cart-items .cart-item .cart-item__details"
    );
    let cartActualPrice = document.querySelectorAll(
      "form#cart .cart-items .cart-item .cart-item__details div.product-option"
    );
    let quantityInput = document.querySelectorAll(
      "form#cart .cart-items .quantity .quantity__input"
    );
    let oneProductValues = document.querySelectorAll("form#cart .cart-items .cart-item .cart-item__totals.right.small-hide .cart-item__price-wrapper .price");

    let cartProductHref = document.querySelectorAll("form#cart .cart-item .cart-item__media .cart-item__link");
    
    let cartFooter = document.querySelector(".js-contents .totals__subtotal-value");
    let cartFooterDiscount = document.querySelector(".cart__footer .cart__blocks .js-contents");

    let total = 0;
    specialCardInfo(cartProductHref, cartItemDetails, cartActualPrice, oneProductValues, quantityInput, cartFooter, cartFooterDiscount, total);

    const elementToObserve = document.querySelector("form#cart");
    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation,index) => {
        if (index == 0) {
          let cartForm = document.querySelector("form#cart");
          let cartItems = document.querySelectorAll(
            "form#cart .cart-items .cart-item"
          );
          const cartItemDetails = document.querySelectorAll(
            "form#cart .cart-items .cart-item .cart-item__details"
          );
          let cartActualPrice = document.querySelectorAll(
            "form#cart .cart-items .cart-item .cart-item__details div.product-option"
          );
          let quantityInput = document.querySelectorAll(
            "form#cart .cart-items .quantity .quantity__input"
          );
          let oneProductValues = document.querySelectorAll("form#cart .cart-items .cart-item .cart-item__totals.right.small-hide .cart-item__price-wrapper .price")
          let cartFooter = document.querySelector(".js-contents .totals__subtotal-value");
          let cartFooterDiscount = document.querySelector(".cart__footer .cart__blocks .js-contents");

          let cartProductHref = document.querySelectorAll("form#cart .cart-item .cart-item__media .cart-item__link");
    
          fetch(window.Shopify.routes.root + `cart.js`)
            .then((res) => res.json())
            .then((data) => {
              if (data && data.items && data.items.length) {
                console.log("data.items", data.items);
              }
              console.log("cartItems.....", cartItems);

              let total = 0;
              // specialCardInfo(cartProductHref, cartItemDetails, cartActualPrice, oneProductValues, quantityInput, cartFooter, cartFooterDiscount, total, elementToObserve, observer);
              cartProductHref.forEach((item,index) => {
                if(cartActualPrice && cartActualPrice.length && cartActualPrice[index]) {
                  let { priceAmount, currencySign, currencyName } = getPriceDetails(cartActualPrice[index]);
                  let comparedString = "?variant";
                  let href = item.href;
                  let string =  getString(href, comparedString);

                  handles.forEach((handle,i) => {
                    if(string == handle) {
                      const updatedPrice = document.createElement("span");
                      let priceAmountInt = parseFloat(priceAmount);
                      priceAmount = getPriceAmount(priceAmountInt);
                      if((discountPercentage && allocationMethod == "ACROSS") || (discountAmount && allocationMethod == "EACH")) {
                        updatedPrice.innerHTML = `${currencySign}${priceAmount}`;
                        cartItemDetails[index].appendChild(updatedPrice);
                        cartActualPrice[index].style.textDecoration = "line-through";
                      }
                    } 
                  })

                  if((discountPercentage && allocationMethod == "ACROSS") || (discountAmount && allocationMethod == "EACH")) {
                    oneProductValues[index].innerHTML = `${currencySign}${(parseFloat(priceAmount)*parseInt(quantityInput[index].attributes.value.nodeValue)).toFixed(2)}`;
                    total = total + parseFloat(priceAmount) * parseInt(quantityInput[index].attributes.value.nodeValue);
                  } else if (discountAmount && allocationMethod == "ACROSS") {
                    total = total + parseFloat(priceAmount) * parseInt(quantityInput[index].attributes.value.nodeValue);
                  } 
                  requestIdleCallback(() => {
                    observer.observe(elementToObserve, { childList: true, subtree: true });
                  });
                  observer.disconnect();
                }
              })
              getFooterDetails(cartFooter, cartFooterDiscount, total);
          });
        }
      });
    });
    // configure the observer to observe changes to the element's innerHTML
    observer.observe(elementToObserve, {
      childList: true,
      subtree: true,
    });
  }
  
  // const cartDrawer = document.querySelector(".cart-drawer");


  const cartDrawer = document.querySelector(".cart-drawer");
  console.log("cartDrawer.........",cartDrawer);
  const cartDrawerActualPrice = document.querySelectorAll(".cart-drawer__form .drawer__cart-items-wrapper .cart-items .cart-item .cart-item__details div.product-option");
  const cartDrawerItemDetails = document.querySelectorAll(".cart-drawer__form .drawer__cart-items-wrapper .cart-items .cart-item .cart-item__details");
  const cartDrawerProductValues = document.querySelectorAll(".cart-drawer__form .drawer__cart-items-wrapper .cart-items .cart-item .cart-item__totals.right .cart-item__price-wrapper .price.price--end");
  const cartDrawerQuantityInput = document.querySelectorAll(".cart-drawer__form .drawer__cart-items-wrapper .cart-items .cart-item .cart-item__quantity .quantity__input");
  const cartDrawerFooter = document.querySelector(".drawer__footer .cart-drawer__footer .totals__subtotal-value");
  const cartDrawerDiscount = document.querySelector(".drawer__footer .cart-drawer__footer");
  const cartDrawerHref = document.querySelectorAll(".cart-drawer__form .drawer__cart-items-wrapper .cart-items .cart-item__media .cart-item__link");
  

  let total = 0;
  if(cartDrawerHref && cartDrawerHref.length) {
    specialCardInfo(cartDrawerHref, cartDrawerItemDetails, cartDrawerActualPrice, cartDrawerProductValues, cartDrawerQuantityInput, cartDrawerFooter, cartDrawerDiscount, total);
  }
  
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation,index) => {
      if (index == 0) {
        const cartDrawerActualPrice = document.querySelectorAll(".cart-drawer__form .drawer__cart-items-wrapper .cart-items .cart-item .cart-item__details div.product-option");
        const cartDrawerItemDetails = document.querySelectorAll(".cart-drawer__form .drawer__cart-items-wrapper .cart-items .cart-item .cart-item__details");
        const cartDrawerProductValues = document.querySelectorAll(".cart-drawer__form .drawer__cart-items-wrapper .cart-items .cart-item .cart-item__totals.right .cart-item__price-wrapper .price.price--end");
        const cartDrawerQuantityInput = document.querySelectorAll(".cart-drawer__form .drawer__cart-items-wrapper .cart-items .cart-item .cart-item__quantity .quantity__input");
        const cartDrawerFooter = document.querySelector(".drawer__footer .cart-drawer__footer .totals__subtotal-value");
        const cartDrawerDiscount = document.querySelector(".drawer__footer .cart-drawer__footer");
        const cartDrawerHref = document.querySelectorAll(".cart-drawer__form .drawer__cart-items-wrapper .cart-items .cart-item__media .cart-item__link");

        fetch(window.Shopify.routes.root + `cart.js`)
          .then((res) => res.json())
          .then((data) => {
            if (data && data.items && data.items.length) {
              console.log("data.items", data.items);
            }
            let total = 0;
            console.log("cartDrawerActualPrice.....", cartDrawerActualPrice)
            // specialCardInfo(cartDrawerHref, cartDrawerItemDetails, cartDrawerActualPrice, cartDrawerProductValues, cartDrawerQuantityInput, cartDrawerFooter, cartDrawerDiscount, total, cartDrawer, observer);
            if(cartDrawerHref && cartDrawerHref.length) {
              cartDrawerHref.forEach((item,index) => {
                if(cartDrawerActualPrice && cartDrawerActualPrice.length && cartDrawerActualPrice[index]) {
                  let { priceAmount, currencySign } = getPriceDetails(cartDrawerActualPrice[index]);
                  let comparedString = "?";
                  let href = item.href;
                  let string =  getString(href, comparedString);
                  handles.forEach((handle,i) => {
                    if(string == handle) {
                      const updatedPrice = document.createElement("span");
                      let priceAmountInt = parseFloat(priceAmount);
                      priceAmount = getPriceAmount(priceAmountInt);
                      if((discountPercentage && allocationMethod == "ACROSS") || (discountAmount && allocationMethod == "EACH")) {
                        updatedPrice.innerHTML = `${currencySign}${priceAmount}`;
                        cartDrawerItemDetails[index].appendChild(updatedPrice);
                        cartDrawerActualPrice[index].style.textDecoration = "line-through";
                      }
                    } 
                  })
                  if((discountPercentage && allocationMethod == "ACROSS") || (discountAmount && allocationMethod == "EACH")) {
                    cartDrawerProductValues[index].innerHTML = `${currencySign}${(parseFloat(priceAmount)*parseInt(cartDrawerQuantityInput[index].attributes.value.nodeValue)).toFixed(2)}`;
                    total = total + parseFloat(priceAmount) * parseInt(cartDrawerQuantityInput[index].attributes.value.nodeValue);
                  } else if (discountAmount && allocationMethod == "ACROSS") {
                    total = total + parseFloat(priceAmount) * parseInt(cartDrawerQuantityInput[index].attributes.value.nodeValue);
                  }  
                  requestIdleCallback(() => {
                    observer.observe(cartDrawer, { childList: true, subtree: true });
                  });
                  observer.disconnect();
                 }
              })
              getFooterDetails(cartDrawerFooter, cartDrawerDiscount, total);
              requestIdleCallback(() => {
                observer.observe(cartDrawer, { childList: true, subtree: true });
              });
              observer.disconnect();
            }
          });
        }
      });
    });
  if(cartDrawer) {
    observer.observe(cartDrawer, {
      childList: true,
      subtree: true,
    });
  }
  document.cookie = `discount_code=${discountCode}`;
}