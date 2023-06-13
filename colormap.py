from PIL import Image

def main():
    area_colors = [
        '#808080',
        '#2f4f4f',
        '#556b2f',
        '#6b8e23',
        '#a0522d',
        '#8b0000',
        '#483d8b',
        '#008000',
        '#3cb371',
        '#b8860b',
        '#bdb76b',
        '#008b8b',
        '#4682b4',
        '#000080',
        '#d2691e',
        '#9acd32',
        '#32cd32',
        '#8fbc8f',
        '#8b008b',
        '#b03060',
        '#ff4500',
        '#ffa500',
        '#ffd700',
        '#6a5acd',
        '#ffff00',
        '#0000cd',
        '#00ff00',
        '#ba55d3',
        '#8a2be2',
        '#00ff7f',
        '#dc143c',
        '#00ffff',
        '#00bfff',
        '#f4a460',
        '#f08080',
        '#adff2f',
        '#ff6347',
        '#b0c4de',
        '#ff00ff',
        '#6495ed',
        '#dda0dd',
        '#ff1493',
        '#afeeee',
        '#98fb98',
        '#7fffd4',
        '#ffe4b5',
        '#ff69b4',
        '#ffb6c1'
    ]
    for i in range(len(area_colors)):
        area_colors[i] = hexColor2Rgba(area_colors[i])
    
    low_high = createThreePtColorMap([42, 20, 82], [56, 166, 120], [245, 240, 95])
    low_high2 = createColorMap([[0, 0, 4], [40, 11, 84], [101, 21, 110], [159, 42, 99], [212, 72, 66], [245, 125, 21], [250, 193, 39], [252, 255, 164]])
    divergent = createThreePtColorMap([190, 0, 0], [255, 255, 255], [45, 45, 180])
    
    img1 = Image.new(mode='RGBA', size=(len(area_colors), 1))
    img1.putdata(area_colors)
    img1.save('areas_cmap.png', 'PNG')
    
    img2 = Image.new(mode='RGBA', size=(len(low_high), 1))
    img2.putdata(low_high)
    img2.save('lowhigh_cmap.png', 'PNG')
    
    img3 = Image.new(mode='RGBA', size=(len(low_high2), 1))
    img3.putdata(low_high2)
    img3.save('lowhigh2_cmap.png', 'PNG')
    
    img4 = Image.new(mode='RGBA', size=(len(divergent), 1))
    img4.putdata(divergent)
    img4.save('divergent_cmap.png', 'PNG')

def createColorMap(color_stops):
    num_colors = 1024
    num_ranges = len(color_stops) - 1
    col_per_stop = num_colors // num_ranges
    col_extra = num_colors % num_ranges
    cmap = []
    for i in range(num_ranges):
        col1 = color_stops[i]
        col2 = color_stops[i + 1]
        num_cols = col_per_stop
        if i < col_extra:
            num_cols += 1
        for j in range(num_cols):
            t = (j + 0.5) / num_cols
            r = round((1 - t) * col1[0] + t * col2[0])
            g = round((1 - t) * col1[1] + t * col2[1])
            b = round((1 - t) * col1[2] + t * col2[2])
            a = 255
            cmap.append((r, g, b, a))
    return cmap

def createThreePtColorMap(low, mid, high):
    num_colors = 1024
    half_num = num_colors // 2
    cmap = []
    for i in range(half_num):
        t = i / half_num;
        r = round((1 - t) * low[0] + t * mid[0])
        g = round((1 - t) * low[1] + t * mid[1])
        b = round((1 - t) * low[2] + t * mid[2])
        a = 255
        cmap.append((r, g, b, a))
    for i in range(half_num, num_colors):
        t = (i - half_num) / (num_colors - half_num)
        r = round((1 - t) * mid[0] + t * high[0])
        g = round((1 - t) * mid[1] + t * high[1])
        b = round((1 - t) * mid[2] + t * high[2])
        a = 255
        cmap.append((r, g, b, a))
    return cmap
    
def hexColor2Rgba(hex_color):
    r = int(hex_color[1:3], 16)
    g = int(hex_color[3:5], 16)
    b = int(hex_color[5:7], 16)
    return (r, g, b, 255)
    
main()
