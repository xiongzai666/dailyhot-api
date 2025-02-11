/*
 * @author: MCBBC
 * @date: 2023-07-17
 * @customEditors: imsyy
 * @lastEditTime: 2023-07-17
 */

const Router = require("koa-router");
const neteaseRouter = new Router();
const axios = require("axios");
const { get, set, del } = require("../utils/cacheData");

// 接口信息
const routerInfo = {
  name: "netease",
  title: "网易新闻",
  subtitle: "热点",
};

// 缓存键名
const cacheKey = "neteaseData";

// 调用时间
let updateTime = new Date().toISOString();

// 调用路径
const url = "https://m.163.com/fe/api/hot/news/flow";

// 数据处理
const getData = (data) => {
  if (!data) return [];
  return data.map((v) => {
    return {
      id: v.skipID,
      title: v.title,
      desc: v._keyword,
      pic: v.imgsrc,
      owner: v.source,
      url: `https://www.163.com/dy/article/${v.skipID}.html`,
      mobileUrl: v.url,
    };
  });
};

// 网易新闻热榜
neteaseRouter.get("/netease", async (ctx) => {
  console.log("获取网易新闻热榜");
  try {
    // 从缓存中获取数据
    let data = await get(cacheKey);
    const from = data ? "cache" : "server";
    if (!data) {
      // 如果缓存中不存在数据
      console.log("从服务端重新获取网易新闻热榜");
      // 从服务器拉取数据
      const response = await axios.get(url);
      data = getData(response.data.data.list);
      updateTime = new Date().toISOString();
      // 将数据写入缓存
      await set(cacheKey, data);
    }
    ctx.body = {
      code: 200,
      message: "获取成功",
      ...routerInfo,
      from,
      total: data.length,
      updateTime,
      data,
    };
  } catch (error) {
    console.error(error);
    ctx.body = {
      code: 500,
      ...routerInfo,
      message: "获取失败",
    };
  }
});

// 网易新闻热榜 - 获取最新数据
neteaseRouter.get("/netease/new", async (ctx) => {
  console.log("获取网易新闻热榜 - 最新数据");
  try {
    // 从服务器拉取最新数据
    const response = await axios.get(url);
    const newData = getData(response.data.data.list);
    updateTime = new Date().toISOString();
    console.log("从服务端重新获取网易新闻热榜");

    // 返回最新数据
    ctx.body = {
      code: 200,
      message: "获取成功",
      ...routerInfo,
      total: newData.length,
      updateTime,
      data: newData,
    };

    // 删除旧数据
    await del(cacheKey);
    // 将最新数据写入缓存
    await set(cacheKey, newData);
  } catch (error) {
    // 如果拉取最新数据失败，尝试从缓存中获取数据
    console.error(error);
    const cachedData = await get(cacheKey);
    if (cachedData) {
      ctx.body = {
        code: 200,
        message: "获取成功",
        ...routerInfo,
        total: cachedData.length,
        updateTime,
        data: cachedData,
      };
    } else {
      // 如果缓存中也没有数据，则返回错误信息
      ctx.body = {
        code: 500,
        ...routerInfo,
        message: "获取失败",
      };
    }
  }
});

neteaseRouter.info = routerInfo;
module.exports = neteaseRouter;
