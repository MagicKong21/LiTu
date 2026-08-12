# 小编工具箱

在线使用：[https://magickong21.github.io/xiaobian-box/](https://magickong21.github.io/xiaobian-box/)

一个完全在浏览器本地运行的双模块图片工具：

- 美化 / 标注：自由排版前景图、更换背景，并添加序号、遮挡、模糊和放大镜标注
- 高级编辑：删段、裁切、透明渐变、双图分隔与融合、窗口提取

所有图片只在当前浏览器标签页内处理，不会上传到服务器。导出格式统一为 PNG，横向分辨率统一为 2000 像素。

## 本地预览

在本目录启动任意静态文件服务器即可，例如：

```bash
python3 -m http.server 8080
```

然后访问 `http://127.0.0.1:8080/`。

## 部署

仓库已包含 GitHub Pages Actions 工作流。推送到 `main` 分支后，在仓库 Settings → Pages 中选择 **GitHub Actions** 作为 Source 即可发布。
