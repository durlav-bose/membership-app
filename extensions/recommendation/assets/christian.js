let curr;
let discountPercentage;
let discountCode;
let discountAmount;
let allocationMethod;
let handles= [];

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
if(customer) {
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
  if (actualPrice && actualPrice.innerHTML && actualPrice.innerHTML.includes("$")) {
    let trim = actualPrice.innerHTML? actualPrice.innerHTML.replace(/^\s+|\s+$/gm, "") : "";
    let trimmedArray = trim.split(" ");
    let priceAmount = trimmedArray[0] && trimmedArray[0].slice(1,trimmedArray[0].length) ? trimmedArray[0].slice(1,trimmedArray[0].length) : "";
    let currencySign = trimmedArray[0] && trimmedArray[0].slice(0,1) ? trimmedArray[0].slice(0,1) : "";
    let currencyName = trimmedArray[1] ? trimmedArray[1] : "";
    // priceAmount = priceAmount.toFixed(2);
    console.log("priceAmount.....1", priceAmount);
    console.log("priceAmount.....1", typeof(priceAmount));
    return {
      priceAmount,
      currencySign,
      currencyName
    }
  } else if (actualPrice && actualPrice.innerHTML && !actualPrice.innerHTML.includes("$")) {
    let trim = actualPrice.innerHTML? actualPrice.innerHTML.replace(/^\s+|\s+$/gm, "") : "";
    let priceAmount = trim;
    // priceAmount = priceAmount.toFixed(2);
    console.log("priceAmount.....2", priceAmount);
    console.log("priceAmount.....2", typeof(priceAmount));
    return {
      priceAmount,
      currencySign: "$",
      currencyName: "USD"
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
  actualPriceMain.style.textDecoration = "line-through";
  actualPriceMain.style.marginRight = "5px";
  priceContainerMain.appendChild(updatedPrice);
}

function getFooterDetails(cartFooter, cartFooterDiscount, total) {
  // let { currencySign, currencyName } = getPriceDetails(cartFooter);
  let currencyItems = getPriceDetails(cartFooter);
  let currencySign;
  let currencyName;
  if (currencyItems && (currencyItems.currencySign || currencyItems.currencyName)) {
    currencySign = currencyItems.currencySign;
    currencyName = currencyItems.currencyName;
  }
  if ((discountPercentage && allocationMethod == "ACROSS") || (discountPercentage && allocationMethod == "EACH") || (discountAmount && allocationMethod == "EACH")) {
    cartFooter && (cartFooter.innerHTML = `${currencySign}${total.toFixed(2)} ${currencyName}`);
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
    subTotalAmountDiv.style.gap = "5px";
    subTotalAmountDiv.style.justifyContent = "space-between";
    discountAmountText.innerHTML = "Discount Amount";
    discountAmountText.style.fontWeight = "bold";
    addedDiscountAmount.innerHTML = `-  ${currencySign}${(-1)*discountAmount} ${currencyName}`;
    discountAmountDiv.append(discountAmountText, addedDiscountAmount);
    discountAmountDiv.style.display = "flex";
    discountAmountDiv.style.alignItems = "center";
    discountAmountDiv.style.gap = "5px";
    discountAmountDiv.style.justifyContent = "space-between";
    cartFooter.innerHTML = `${currencySign} ${(total).toFixed(2)} ${currencyName}`;
    content.append(discountAmountDiv, subTotalAmountDiv);
    // cartFooterDiscount.insertBefore(content, cartFooterDiscount.children[1]);
    cartFooterDiscount.append(content);
  }
}

function setEachCardDom(item,index,actualPrice,priceContainer) {
  const updatedPrice = document.createElement("span");
  let { priceAmount, currencySign, currencyName } = getPriceDetails(actualPrice);
  let priceAmountInt = parseFloat(priceAmount);
  priceAmount = getPriceAmount(priceAmountInt);
  updatedPrice.innerHTML = `${currencySign}${priceAmount.toFixed(2)} ${currencyName}`;
  setDomStyle(actualPrice,priceContainer, updatedPrice);
}

function specialCardInfo(cartProductHref, cartItemDetails, cartActualPrice, oneProductValues, quantityInput, cartFooter, cartFooterDiscount, total, elementToObserve, observer) {
  console.log("cartActualPrice.........", cartActualPrice)
  cartProductHref.forEach((item,index) => {
    let string;
    if (oneProductValues != false) {
      let comparedString = "?";
      let href = item.href;
      string =  getString(href, comparedString);
    } else {
      var str = item.href;
      var n = str.lastIndexOf('/');
      let endIndex;
      if(str.includes("?")) {
        endIndex = str.indexOf("?");
      } else {
        endIndex = undefined;
      }
      string = str.substring(n + 1, endIndex);
    }
    if (cartActualPrice && cartActualPrice.length && cartActualPrice[index]) {
      let { priceAmount, currencySign, currencyName } = getPriceDetails(cartActualPrice[index]);
      handles.forEach((handle,i) => {
        if(string == handle) {
          const updatedPrice = document.createElement("span");
          let priceAmountInt = parseFloat(priceAmount);
          priceAmount = getPriceAmount(priceAmountInt);
          console.log("priceAmount.....", priceAmount)
          if((discountPercentage && allocationMethod == "ACROSS") || (discountPercentage && allocationMethod == "EACH") || (discountAmount && allocationMethod == "EACH")) {
            if(cartItemDetails[index].children.length <= 1) {
              updatedPrice.innerHTML = `${currencySign}${priceAmount.toFixed(2)}`;
              cartItemDetails[index].appendChild(updatedPrice);
              cartActualPrice[index].style.textDecoration = "line-through";
              cartActualPrice[index].style.marginRight = "5px";
            }
          }
        } 
      })
      
      if((discountPercentage && allocationMethod == "ACROSS") || (discountPercentage && allocationMethod == "EACH") || (discountAmount && allocationMethod == "EACH")) {
        if(oneProductValues != false) {
          oneProductValues[index].innerHTML = `${currencySign}${(parseFloat(priceAmount)*parseInt(quantityInput[index].attributes.value.nodeValue)).toFixed(2)}`;
        }
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
    console.log("cartFooter inside specialCardInfo.....", cartFooter);
    getFooterDetails(cartFooter, cartFooterDiscount, total);
  }
}

function updatedDom() {
  if(discountCode) {
    document.cookie = `discount_code=${discountCode}`;
  }

  if (window.location.pathname == "/") {
    let productTitle = document.querySelectorAll(".product-list.product-list--collection .product-info__caption");
    let priceContainer = document.querySelectorAll(".product-list.product-list--collection .product-info__caption .product-details .price .current_price");
    let actualPrice = document.querySelectorAll(".product-list.product-list--collection .product-info__caption .product-details .price .current_price .money");

    if((discountPercentage && allocationMethod == "ACROSS") || (discountPercentage && allocationMethod == "EACH") || (discountAmount && allocationMethod == "EACH")) { 
      productTitle.forEach((item,index) => {
        var str = item.href;
        var n = str.lastIndexOf('/');
        var string = str.substring(n + 1);
        console.log("string.....",string);
        handles.forEach((handle,i) => {
          if(string == handle) {
            setEachCardDom(item,index,actualPrice[index], priceContainer[index]);
          }
        })
      })
    }
  } else if (window.location.pathname.includes("/collections/") && !window.location.pathname.includes("/products/")) {
    let productTitle = document.querySelectorAll(".product-list.product-list--collection .product-info__caption");
    let priceContainer = document.querySelectorAll(".product-list.product-list--collection .product-info__caption .product-details .price .current_price");
    let actualPrice = document.querySelectorAll(".product-list.product-list--collection .product-info__caption .product-details .price .current_price .money");

    if((discountPercentage && allocationMethod == "ACROSS") || (discountPercentage && allocationMethod == "EACH") || (discountAmount && allocationMethod == "EACH")) { 
      productTitle.forEach((item,index) => {
        var str = item.href;
        var n = str.lastIndexOf('/');
        var string = str.substring(n + 1);
        console.log("string.....",string);
        handles.forEach((handle,i) => {
          if(string == handle) {
            setEachCardDom(item,index,actualPrice[index], priceContainer[index]);
          }
        })
      })
    }
  } else if ((window.location.pathname.includes("/collections/") && window.location.pathname.includes("/products/")) || (!window.location.pathname.includes("/collections/") && window.location.pathname.includes("/products/"))) {
    let productTitle = document.querySelectorAll(".product-list.product-list--collection .product-info__caption");
    let priceContainer = document.querySelectorAll(".product-list.product-list--collection .product-info__caption .product-details .price .current_price");
    let actualPrice = document.querySelectorAll(".product-list.product-list--collection .product-info__caption .product-details .price .current_price .money");

    if((discountPercentage && allocationMethod == "ACROSS") || (discountPercentage && allocationMethod == "EACH") || (discountAmount && allocationMethod == "EACH")) { 
      productTitle.forEach((item,index) => {
        var str = item.href;
        var n = str.lastIndexOf('/');
        let endIndex;
        if(str.includes("?")) {
          endIndex = str.indexOf("?");
        } else {
          endIndex = undefined;
        }
        var string = str.substring(n + 1, endIndex);
        console.log("string.....",string);
        
        handles.forEach((handle,i) => {
          if(string == handle) {
            setEachCardDom(item,index,actualPrice[index], priceContainer[index]);
          }
        })
      })
    }

    let gridItemMain = document.querySelectorAll(
      ".product-container"
    );
    let priceContainerMain = document.querySelectorAll(".product-container .product-main .product_section .product__details.product__details--product-page .price");
    let actualPriceMain = document.querySelectorAll(
      ".product-container .product-main .product_section .product__details.product__details--product-page .price .money"
    );

    if((discountPercentage && allocationMethod == "ACROSS") || (discountPercentage && allocationMethod == "EACH") || (discountAmount && allocationMethod == "EACH")) {

      var str = window.location.href;
      var n = str.lastIndexOf('/');
      let endIndex;
      if(str.includes("?")) {
        endIndex = str.indexOf("?");
      } else {
        endIndex = undefined;
      }
      string = str.substring(n + 1, endIndex);
      console.log("string.....", string);

      handles.forEach((handle,ind) => {
        if(string == handle) {
          gridItemMain.forEach((item, index) => {
            setEachCardDom(item,index,actualPriceMain[index], priceContainerMain[index]);
          });
        }
      })
    }
  } else if (window.location.pathname == "/cart") {
    const cartItemDetails = document.querySelectorAll("form#cart_form .cart__wrapper .cart__item .cart_content_info .modal_price");
    let cartActualPrice = document.querySelectorAll("form#cart_form .cart__wrapper .cart__item .cart_content_info .modal_price .money");
    let quantityInput = document.querySelectorAll("form#cart_form .cart__wrapper .cart__item .cart_content_info .product-quantity-box .quantity");
    let oneProductValues = document.querySelectorAll("form#cart_form .cart__wrapper .cart__item .cart_content_info .price_total .money");
    let cartProductHref = document.querySelectorAll("form#cart_form .cart__wrapper .cart__item .cart__item--title a");
    let cartFooter = document.querySelector("form#cart_form .cart__wrapper .subtotal .cart_subtotal.js-cart_subtotal .right .money");
    let cartFooterDiscount = document.querySelector("form#cart_form .cart__wrapper .subtotal .cart_subtotal.js-cart_subtotal");
    let total = 0;
    specialCardInfo(cartProductHref, cartItemDetails, cartActualPrice, oneProductValues, quantityInput, cartFooter, cartFooterDiscount, total);

  } else if (window.location.pathname == "/search") {
    console.log("search.....");
    let searchPageItems = document.querySelectorAll(".product-list.product-list--search .product_row");
    let searchPageItemsHref = document.querySelectorAll(".product-list.product-list--search .product_row .sub_title a");
    let searchItemsPriceDiv = document.querySelectorAll(".product-list.product-list--search .product_row .info .price");
    let searchItemsPrice = document.querySelectorAll(".product-list.product-list--search .product_row .info .price .money");

    if((discountPercentage && allocationMethod == "ACROSS") || (discountPercentage && allocationMethod == "EACH") || (discountAmount && allocationMethod == "EACH")) { 
      searchPageItemsHref.forEach((item,index) => {
        var str = item.href;
        var n = str.lastIndexOf('/');
        let endIndex;
        if(str.includes("?")) {
          endIndex = str.indexOf("?");
        } else {
          endIndex = undefined;
        }
        var string = str.substring(n + 1, endIndex);
        console.log("string.....",string);
        
        handles.forEach((handle,i) => {
          if(string == handle) {
            setEachCardDom(item,index,searchItemsPrice[index], searchItemsPriceDiv[index]);
          }
        })
      })
    }

    let searchInput = document.querySelectorAll(".search_page .search__container .search__form input");
    searchInput.forEach((item,index) => {
      if(item.placeholder.includes("Search")) {
        item.addEventListener("keydown", async(e) => {
          if (e.target.value && e.target.value.length) {
            const myInterval = setInterval(() => {
              let searchResultLi = document.querySelectorAll(".search__results-wrapper.results-found .search__results .item-result");
              if(searchResultLi && searchResultLi.length) {
                mySearch();
                // clearInterval(myInterval);
              }
              clearInterval(myInterval);
            }, 3000)

            function mySearch() {
              let searchResultMain = document.querySelector(".search__results-wrapper.results-found");
              let searchResultUl = document.querySelector(".search__results-wrapper.results-found .search__results");
              let searchResultLi = document.querySelectorAll(".search__results-wrapper.results-found .search__results .item-result");
              let searchResultHref = document.querySelectorAll(".search__results-wrapper.results-found .search__results .item-result a");
              let searchResultPriceDiv = document.querySelectorAll(".search__results-wrapper.results-found .search__results .item-result a .item-pricing.price");
              let searchResultPrice = document.querySelectorAll(".search__results-wrapper.results-found .search__results .item-result a .item-pricing.price .money");
    
              if(searchResultHref && searchResultHref.length) {
                searchResultHref.forEach((item,index) => {
                  let { priceAmount, currencySign } = getPriceDetails(searchResultPrice[index]);
                  var str = item.href;
                  var n = str.lastIndexOf('/');
                  let endIndex;
                  if(str.includes("?")) {
                    endIndex = str.indexOf("?");
                  } else {
                    endIndex = undefined;
                  }
                  string = str.substring(n + 1, endIndex);
                  handles.forEach((handle,i) => {
                    if(string == handle) {
                      const updatedPrice = document.createElement("span");
                      console.log("updatedPrice.....", updatedPrice);
                      let priceAmountInt = parseFloat(priceAmount);
                      priceAmount = getPriceAmount(priceAmountInt);
                      if((discountPercentage && allocationMethod == "ACROSS") || (discountPercentage && allocationMethod == "EACH") || (discountAmount && allocationMethod == "EACH")) {
                        updatedPrice.innerHTML = `${currencySign}${priceAmount}`;
                        updatedPrice.classList.add("mod-price");
                        if(searchResultPriceDiv[index].children && searchResultPriceDiv[index].children.length <= 1) {
                          searchResultPriceDiv[index].appendChild(updatedPrice);
                          searchResultPrice[index].style.textDecoration = "line-through";
                          searchResultPrice[index].style.marginRight = "5px";
                        }
                      }
                    } 
                  })
                })
              }
            }
          }
        })
      }
    })  
  }

  let hoveredCart = document.querySelectorAll(".search-enabled--true.is-absolute .tos_warning.cart_content form");
  let hoveredCartFooterDiv = document.querySelector(".search-enabled--true.is-absolute .tos_warning.cart_content form ul .cart_subtotal.js-cart_subtotal");
  let hoveredItems = document.querySelectorAll(".search-enabled--true.is-absolute .tos_warning.cart_content form .cart_items.js-cart_items .mini-cart__item .mini-cart__item-content .mini-cart__item-price");
  let hoveredItemsPrice = document.querySelectorAll(".search-enabled--true.is-absolute .tos_warning.cart_content form .cart_items.js-cart_items .mini-cart__item .mini-cart__item-content .mini-cart__item-price .money");
  let hoveredItemsHref = document.querySelectorAll(".search-enabled--true.is-absolute .tos_warning.cart_content form .cart_items.js-cart_items .mini-cart__item .mini-cart__item-content .mini-cart__item-title a");
  let hoveredItemsPriceTotal = document.querySelector(".search-enabled--true.is-absolute .tos_warning.cart_content form .cart_subtotal.js-cart_subtotal .right .money");
  let hoveredCartQuantityInput = document.querySelectorAll(".search-enabled--true.is-absolute .tos_warning.cart_content .cart_items.js-cart_items .mini-cart__item .mini-cart__item-content .product-quantity-box .quantity");
  let total = 0;
  specialCardInfo(hoveredItemsHref, hoveredItems, hoveredItemsPrice, false, hoveredCartQuantityInput, hoveredItemsPriceTotal, hoveredCartFooterDiv, total);

  const elementToObserve = document.querySelector(".search-enabled--true.is-absolute .tos_warning.cart_content form");
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation,index) => {
      if (index == 0) {
        let hoveredCart = document.querySelectorAll(".search-enabled--true.is-absolute .tos_warning.cart_content form");
        let hoveredCartFooterDiv = document.querySelector(".search-enabled--true.is-absolute .tos_warning.cart_content form ul .cart_subtotal.js-cart_subtotal");
        let hoveredItems = document.querySelectorAll(".search-enabled--true.is-absolute .tos_warning.cart_content form .cart_items.js-cart_items .mini-cart__item .mini-cart__item-content .mini-cart__item-price");
        let hoveredItemsPrice = document.querySelectorAll(".search-enabled--true.is-absolute .tos_warning.cart_content form .cart_items.js-cart_items .mini-cart__item .mini-cart__item-content .mini-cart__item-price .money");
        let hoveredItemsHref = document.querySelectorAll(".search-enabled--true.is-absolute .tos_warning.cart_content form .cart_items.js-cart_items .mini-cart__item .mini-cart__item-content .mini-cart__item-title a");
        let hoveredItemsPriceTotal = document.querySelector(".search-enabled--true.is-absolute .tos_warning.cart_content form .cart_subtotal.js-cart_subtotal .right .money");
        let hoveredCartQuantityInput = document.querySelectorAll(".search-enabled--true.is-absolute .tos_warning.cart_content .cart_items.js-cart_items .mini-cart__item .mini-cart__item-content .product-quantity-box .quantity");
  
        fetch(window.Shopify.routes.root + `cart.js`)
          .then((res) => res.json())
          .then((data) => {
            if (data && data.items && data.items.length) {
              console.log("data.items", data.items);
            }
            let total = 0;
            // specialCardInfo(cartProductHref, cartItemDetails, cartActualPrice, oneProductValues, quantityInput, cartFooter, cartFooterDiscount, total, elementToObserve, observer);
            hoveredItemsHref.forEach((item,index) => {
              console.log("hoveredItems.....", hoveredItems);
              console.log("hoveredItemsHref.....", hoveredItemsHref);
              if(hoveredItemsPrice && hoveredItemsPrice.length && hoveredItemsPrice[index]) {
                console.log("hoveredItemsPrice.....", hoveredItemsPrice);
                let { priceAmount, currencySign, currencyName } = getPriceDetails(hoveredItemsPrice[index]);
                var str = item.href;
                var n = str.lastIndexOf('/');
                let endIndex;
                if(str.includes("?")) {
                  endIndex = str.indexOf("?");
                } else {
                  endIndex = undefined;
                }
                string = str.substring(n + 1, endIndex);

                console.log("string......", string);

                handles.forEach((handle,i) => {
                  if(string == handle) {
                    const updatedPrice = document.createElement("span");
                    let priceAmountInt = parseFloat(priceAmount);
                    priceAmount = getPriceAmount(priceAmountInt);
                    if((discountPercentage && allocationMethod == "ACROSS") || (discountPercentage && allocationMethod == "EACH") || (discountAmount && allocationMethod == "EACH")) {
                      if(hoveredItems[index].children.length <= 1) {
                        updatedPrice.innerHTML = `${currencySign}${priceAmount.toFixed(2)}`;
                        hoveredItems[index].appendChild(updatedPrice);
                        hoveredItemsPrice[index].style.textDecoration = "line-through";
                        hoveredItemsPrice[index].style.marginRight = "5px";
                      }
                    }
                  } 
                })

                if((discountPercentage && allocationMethod == "ACROSS") || (discountPercentage && allocationMethod == "EACH") || (discountAmount && allocationMethod == "EACH")) {
                  // console.log("hoveredCartQuantityInput[index].attributes.value.nodeValue.....", hoveredCartQuantityInput[index].attributes.value.nodeValue);
                  // console.log("parseFloat(priceAmount).....", parseFloat(priceAmount));
                  // oneProductValues[index].innerHTML = `${currencySign}${(parseFloat(priceAmount)*parseInt(hoveredCartQuantityInput[index].attributes.value.nodeValue)).toFixed(2)}`;
                  total = total + parseFloat(priceAmount) * parseInt(hoveredCartQuantityInput[index].attributes.value.nodeValue);
                  // console.log("total.....", total);
                } else if (discountAmount && allocationMethod == "ACROSS") {
                  total = total + parseFloat(priceAmount) * parseInt(hoveredCartQuantityInput[index].attributes.value.nodeValue);
                } 
                // requestIdleCallback(() => {
                //   observer.observe(elementToObserve, { childList: true, subtree: true });
                // });
                // observer.disconnect();
              }
            })
            // console.log("total.......=======.......", total);
            getFooterDetails(hoveredItemsPriceTotal, hoveredCartFooterDiv, total);
            setTimeout(() => {
              // requestIdleCallback(() => {
                observer.observe(elementToObserve, { childList: true, subtree: true });
              // });
              // observer.disconnect();
            }, 100);
            observer.disconnect();
            // console.log("total.......=======.......", total);
            
        });
      }
    });
  });
  // configure the observer to observe changes to the element's innerHTML
  if(elementToObserve) {
    observer.observe(elementToObserve, {
      childList: true,
      subtree: true,
    });
  }
  
  let searchInput = document.querySelectorAll(".main-nav__wrapper .search-container .search__form input");
  searchInput.forEach((item,index) => {
    if(item.placeholder == "Search") {
      item.addEventListener("keydown", async(e) => {
        if (e.target.value && e.target.value.length) {
          const myInterval = setInterval(() => {
            let searchResultLi = document.querySelectorAll(".search__results-wrapper.results-found .search__results .item-result");
            if(searchResultLi && searchResultLi.length) {
              mySearch();
              // clearInterval(myInterval);
            }
            clearInterval(myInterval);
          }, 3000)

          function mySearch() {
            let searchResultMain = document.querySelector(".search__results-wrapper.results-found");
            let searchResultUl = document.querySelector(".search__results-wrapper.results-found .search__results");
            let searchResultLi = document.querySelectorAll(".search__results-wrapper.results-found .search__results .item-result");
            let searchResultHref = document.querySelectorAll(".search__results-wrapper.results-found .search__results .item-result a");
            let searchResultPriceDiv = document.querySelectorAll(".search__results-wrapper.results-found .search__results .item-result a .item-pricing.price");
            let searchResultPrice = document.querySelectorAll(".search__results-wrapper.results-found .search__results .item-result a .item-pricing.price .money");
  
            if(searchResultHref && searchResultHref.length) {
              searchResultHref.forEach((item,index) => {
                let { priceAmount, currencySign } = getPriceDetails(searchResultPrice[index]);
                var str = item.href;
                var n = str.lastIndexOf('/');
                let endIndex;
                if(str.includes("?")) {
                  endIndex = str.indexOf("?");
                } else {
                  endIndex = undefined;
                }
                string = str.substring(n + 1, endIndex);
                handles.forEach((handle,i) => {
                  if(string == handle) {
                    const updatedPrice = document.createElement("span");
                    
                    console.log("updatedPrice.....", updatedPrice);
                    let priceAmountInt = parseFloat(priceAmount);
                    priceAmount = getPriceAmount(priceAmountInt);
                    if((discountPercentage && allocationMethod == "ACROSS") || (discountPercentage && allocationMethod == "EACH") || (discountAmount && allocationMethod == "EACH")) {
                      updatedPrice.innerHTML = `${currencySign}${priceAmount.toFixed(2)}`;
                      updatedPrice.classList.add("mod-price");
                      if(searchResultPriceDiv[index].children && searchResultPriceDiv[index].children.length <= 1) {
                        searchResultPriceDiv[index].appendChild(updatedPrice);
                        searchResultPrice[index].style.textDecoration = "line-through";
                        searchResultPrice[index].style.marginRight = "5px";
                      }
                    }
                  } 
                })
              })
            }
          }
        }
      })
    }
  })  
}















