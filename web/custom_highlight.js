/**
 * 查找两个字符串最长的共同部分
 * @param {string} str1
 * @param {string} str2
 * @see {@link https://www.geeksforgeeks.org/javascript-program-to-find-longest-common-substring-between-two-strings/}
 * @returns 公共部分
 */
function findLongestCommonSubstring(str1, str2) {
  let longestSubstring = "";

  for (let i = 0; i < str1.length; i++) {
    for (let j = 0; j < str2.length; j++) {
      let substring = "";
      let x = i;
      let y = j;

      while (x < str1.length && y < str2.length && str1[x] === str2[y]) {
        substring += str1[x];
        x++;
        y++;
      }

      if (substring.length > longestSubstring.length) {
        longestSubstring = substring;
      }
    }
  }

  return longestSubstring;
}

// 文本层自定义高亮回调
function customHighlightHandler(searchKeywords = []) {
  if (!searchKeywords.length) {
    return;
  }
  window.PDFViewerApplication.eventBus.on(
    "textlayerrendered",
    ({ source: pageView, pageNumber, error }) => {
      console.warn("textlayerrendered", {
        pageView,
        pageNumber,
        error,
      });
      customHighlight({
        pageView,
        searchKeywords,
      });
    }
  );
}

// 清除所有自定义高亮
function removeCustomHighlight() {
  console.warn("removeCustomHighlight");
  const nodes = document.querySelectorAll("[custom-highlight]");
  nodes.forEach(n => n.remove());
}

/**
 * 文本层自定义高亮
 * @param {Object}  pageView        页面视图对象
 * @example
 * // NOTE: pageIndex 从 0 开始计数
 * const pageView = PDFViewerApplication.pdfViewer.getPageView(pageIndex)
 * @param {Array}   searchKeywords  关键字数组
 */
function customHighlight({ pageView, searchKeywords = [] }) {
  const pageNumber = pageView.id;
  const textLayerBuilder = pageView.textLayer;
  const textLayer = pageView.textLayer.textLayer;
  // 遍历 textItems, 从 i0 -> in, i1 -> in, ..., in-1 -> in,
  // 检查是否有子字符串匹配 searchKeywords, 若有, 则将该子串样式高亮
  searchKeywords.forEach(keywords => {
    const textItems = textLayer.textContentItemsStr;
    // console.log("textItems", textItems);
    // 获取所有匹配字符串
    const matchedArr = []; // 匹配结果数组
    for (let i = 0; i < textItems.length; i += 1) {
      // 剩余字符串长度
      let remainLength = 0;
      // 计算剩余字符串长度
      for (let j = i; j < textItems.length; j += 1) {
        remainLength += textItems[j].length;
      }
      // console.log("remainLength", remainLength);
      // 若剩余字符串长度大于关键字，则进行匹配
      if (remainLength >= keywords.length) {
        let concatenatedStr = ""; // 拼接字符串
        // 遍历剩余字符串，匹配关键字
        for (let k = i; k < textItems.length; k += 1) {
          concatenatedStr += textItems[k];
          // 判断拼接字符串中，是否包含关键字
          if (concatenatedStr.includes(keywords)) {
            // console.log("concatenatedStr", concatenatedStr);
            let reverseStr = ""; // 反向拼接字符串
            // 反向遍历剩余字符，计算匹配开始下标
            for (let l = k; l >= i; l -= 1) {
              reverseStr = textItems[l] + reverseStr;
              if (reverseStr.includes(keywords)) {
                matchedArr.push({
                  start: l,
                  end: k,
                  keywords,
                  fullString: concatenatedStr,
                });
                break;
              }
            }
            // 更新外层循环索引，同时退出当前匹配循环
            i = k;
            break;
          }
        }
      }
      // 否则退出匹配
      else {
        break;
      }
    }

    // console.log("matchedArr", pageNumber, keywords, matchedArr);

    // 高亮所有匹配字符串
    matchedArr.forEach(({ start, end }) => {
      // 判断高亮是否已存在，若存在则不再新增
      const existed = document.querySelector(
        `[custom-highlight="${pageNumber}-${start}-${end}"]`
      );
      if (existed) {
        return;
      }
      // 单个匹配字符串完全包含关键字
      if (start === end) {
        const node = textLayer.textDivs[start].cloneNode(true);
        const regex = new RegExp(`(${keywords})`);
        // eslint-disable-next-line no-unsanitized/property
        node.innerHTML = node.innerHTML.replace(
          regex,
          "<strong style='border: 1px solid red; background-color: rgba(255, 0, 0, 0.25);'>$1</strong>"
        );
        // 添加标记，以便销毁
        node.setAttribute("custom-highlight", `${pageNumber}-${start}-${end}`);
        // 将高亮节点添加到文本层
        textLayerBuilder.div.append(node);
      }
      // 多个匹配字符串完全包含关键字
      else {
        let fullContainedStr = "";
        for (let i = start; i <= end; i += 1) {
          const node = textLayer.textDivs[i].cloneNode(true);
          // 处理第一个匹配字符串
          if (i === start) {
            const firstHalfContainedStr = findLongestCommonSubstring(
              node.innerHTML,
              keywords
            );
            fullContainedStr += firstHalfContainedStr;
            // console.log("firstHalfContainedStr", firstHalfContainedStr);
            const regex = new RegExp(`(${firstHalfContainedStr})`);
            // eslint-disable-next-line no-unsanitized/property
            node.innerHTML = node.innerHTML.replace(
              regex,
              "<strong style='border: 1px solid red; background-color: rgba(255, 0, 0, 0.25);'>$1</strong>"
            );
          }
          // 处理中间完全匹配的字符串
          else if (i > start && i < end) {
            // console.log("fullContainedStr", node.innerHTML);
            node.style.border = "1px solid red";
            node.style.backgroundColor = "rgba(255, 0, 0, 0.25)";
            fullContainedStr += node.innerHTML;
          }
          // 处理最后一个匹配字符串
          else {
            const lastHalfContainedStr = keywords.substring(
              fullContainedStr.length
            );
            // console.log("lastHalfContainedStr", lastHalfContainedStr);
            const regex = new RegExp(`(${lastHalfContainedStr})`);
            // eslint-disable-next-line no-unsanitized/property
            node.innerHTML = node.innerHTML.replace(
              regex,
              "<strong style='border: 1px solid red; background-color: rgba(255, 0, 0, 0.25);'>$1</strong>"
            );
          }
          // 添加标记，以便销毁
          node.setAttribute(
            "custom-highlight",
            `${pageNumber}-${start}-${end}`
          );
          // 将高亮节点添加到文本层
          textLayerBuilder.div.append(node);
        }
      }
    });
  });
}

window.customHighlight = customHighlight;
window.removeCustomHighlight = removeCustomHighlight;
export { customHighlightHandler };
