

function pluginUpload(container) {
    var form = document.createElement('div')
    var upload = document.createElement('input')
    upload.type = 'file'
    form.appendChild(upload)
    var btnUpload = document.createElement('button')
    btnUpload.innerHTML = "upload"
    btnUpload.onclick = function () {
        var formdata = new FormData();
        formdata.append("upload_file", upload.files[0]) // 前面的"upload_file"是后端获取文件的key，后面的参数是获取文件的(两个列表，都获取第一个)
        $.ajax({
            url: "/ajax_upload",
            type: "POST",
            data: formdata,
            contentType: false,
            processData: false,
            success: function (data) {
                if (data["code"] == "200") {
                    alert(data["message"])
                }

            },
            error: function (data) {
                alert("处理失败")
            }

        })
    }
    form.appendChild(btnUpload)
    container.appendChild(form)
}
